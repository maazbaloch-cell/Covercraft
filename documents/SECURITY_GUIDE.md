# Security Guide
## CoverCraft Platform

**Owner:** CTO / DevOps

---

## 1. Security Principles

1. Defense in depth — never rely on a single layer (UI restriction, Server Action check, DB constraint).
2. Least privilege — RBAC scoped tightly; service credentials scoped to only what they need.
3. Secure by default — every new external-facing route/webhook must be threat-modeled before merge.
4. Auditability — every privileged action (order status change) is logged immutably.

---

## 2. Authentication & Authorization

### 2.1 Authentication — Clerk

- All customer and admin authentication handled via Clerk (session cookies, MFA-capable).
- Admin/Staff accounts **must** have MFA enabled (enforced via Clerk organization/role settings) — customer accounts MFA optional.
- Clerk webhook (`user.created`, `user.updated`) syncs `User` records into Postgres (`clerkUserId` as the join key) — webhook signature verified using Clerk's `svix` signing secret.

### 2.2 Authorization — RBAC

| Role | Capabilities |
|---|---|
| `CUSTOMER` | Own orders, own designs, own addresses only |
| `SUPPORT` | Read-only access to all orders (for support inquiries), cannot change status |
| `STAFF` | Full order status management, cannot manage products/catalog |
| `ADMIN` | Full access: orders, catalog, templates, audit logs, user role management |

```ts
// lib/auth/rbac.ts
export async function requireRole(allowed: Role[]) {
  const { userId, sessionClaims } = auth();
  if (!userId) throw new UnauthorizedError();
  const role = sessionClaims?.metadata?.role as Role;
  if (!allowed.includes(role)) throw new ForbiddenError();
  return { id: userId, role };
}
```

- **Every** Server Action that mutates state calls `requireRole(...)` — never trust client-side role checks alone (UI hiding a button is UX, not security).
- Row-level checks additionally verify a `CUSTOMER` only accesses their own `orderId`/`userId` records, even if role check passes.

---

## 3. Data Protection

| Data Class | Protection |
|---|---|
| Passwords | Not stored by us — delegated entirely to Clerk |
| PII (name, phone, email, address) | Encrypted at rest via managed Postgres provider's disk encryption; TLS in transit everywhere |
| Custom design uploads | Stored in object storage (e.g., Vercel Blob / S3-compatible) with signed, expiring URLs — not publicly listable buckets |
| Payment data | **Never stored by us.** Payment gateway (hosted checkout/tokenization) handles card data entirely; we store only `paymentStatus` and a gateway reference ID (PCI scope minimization) |
| Audit logs | Immutable, retained indefinitely, access restricted to `ADMIN` role |

---

## 4. Webhook Security

All inbound webhooks (Meta WhatsApp, payment gateway, Clerk) **must**:

1. Verify the provider's cryptographic signature before processing any payload (`X-Hub-Signature-256` for Meta, HMAC for payment gateway, `svix` signature for Clerk).
2. Respond `200` only after successful verification + processing (or async queuing); reject with `401`/`400` on signature mismatch.
3. Be idempotent — duplicate webhook deliveries (common in at-least-once delivery systems) must not create duplicate side effects (use `providerMessageId`/event ID as a dedup key).
4. Log raw payloads (redacting sensitive fields) for debugging, with retention limits.

```ts
// Example: Meta webhook signature verification
function verifyMetaSignature(rawBody: string, signatureHeader: string): boolean {
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.WA_APP_SECRET!)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

---

## 5. Public Tracking Page — Threat Model

The guest `/track` page is the highest-risk unauthenticated surface (potential for order enumeration/scraping of customer data):

| Threat | Mitigation |
|---|---|
| Order ID enumeration (guessing sequential IDs) | `orderNumber` is non-sequential/non-guessable (e.g., includes random suffix), not the internal `cuid` PK exposed as sequential |
| Brute-forcing verification factor (phone last-4) | Rate limiting (e.g., 5 attempts / 15 min per IP + per orderNumber) via middleware/Upstash Redis rate limiter |
| Data over-exposure | Response is masked: city-level address only, no full phone/email echoed back, no other customers' data reachable |
| Automated scraping | CAPTCHA/challenge (e.g., Cloudflare Turnstile) on repeated failed attempts |

---

## 6. Input Validation

- All Server Action inputs validated with **Zod** schemas at the boundary — no unvalidated data reaches domain services.
- File uploads (custom design images) validated for: file type allowlist (jpg/png/webp), max size (e.g., 15MB), and re-encoded/sanitized server-side (strip EXIF metadata, prevent embedded scripts in SVG-like formats — SVG uploads disallowed for user content).
- SQL injection is structurally prevented via Prisma's parameterized queries — raw SQL (`$queryRaw`) usage requires explicit review and parameterization.

---

## 7. Secrets Management

- All secrets live in Vercel Environment Variables (encrypted at rest), scoped per environment (Production secrets never present in Preview/Development scope).
- `.env.example` in the repo documents required variable names only — never real values.
- Secret rotation policy: API keys (Resend, Meta, payment gateway) rotated at minimum annually or immediately upon suspected compromise; rotation runbook documented in the internal ops wiki.

---

## 8. Rate Limiting & Abuse Prevention

| Surface | Limit |
|---|---|
| Guest tracking lookup | 5 attempts / 15 min per (IP, orderNumber) |
| Checkout submission | 10 / hour per IP (fraud/spam prevention) |
| Login (delegated to Clerk) | Clerk's built-in brute-force protection |
| Admin status-change Server Action | Not rate-limited by IP (authenticated, low-frequency, human-driven), but every call is audit-logged |

Implemented via an edge middleware rate limiter (e.g., Upstash Redis + `@upstash/ratelimit`).

---

## 9. Dependency & Supply Chain Security

- Dependabot (or Renovate) enabled for automated dependency update PRs.
- `npm audit` / GitHub Advanced Security dependency scanning gated in CI (see `TESTING_STRATEGY.md § Non-Functional Testing`).
- Lockfile (`pnpm-lock.yaml`) committed and enforced (`--frozen-lockfile` in CI) to prevent supply-chain drift.

---

## 10. Compliance Considerations

- **WhatsApp opt-out compliance:** `STOP` keyword handling is mandatory (see `WHATSAPP_AUTOMATION_ARCHITECTURE.md § 6`) — required by Meta's commerce policy and general anti-spam best practice.
- **Data subject requests:** Admin tooling must support locating and (where legally required) exporting/deleting a customer's PII on request — a documented manual runbook at launch, automatable in Phase 2.
- **PCI DSS scope minimization:** Achieved by never touching raw card data (hosted payment gateway checkout only).

---

## 11. Incident Response

1. Detect (monitoring alert, Dead Letter spike, error rate spike, or manual report).
2. Contain (rotate compromised credential, disable affected route via feature flag if needed).
3. Assess scope (query `AuditLog`/`NotificationLog` for affected orders/users).
4. Notify (internal stakeholders immediately; affected customers per applicable breach-notification requirements if PII exposed).
5. Post-incident review documented as an ADR-style incident report, stored alongside `docs/adr/`.
