# CoverCraft — Premium Custom Mobile Covers & Accessories Platform

> Production-grade documentation set for a D2C ecommerce platform selling custom-printed mobile back covers and mobile accessories.

This repository (documentation set) describes the full product, architecture, and operating model for the platform, built as a modern, serverless-first Next.js application with a manual, admin-driven fulfillment model that is architected to scale into automated courier and ERP integrations.

---

## 1. What This Business Is

CoverCraft is a premium D2C (direct-to-consumer) ecommerce brand that sells:

- Custom, print-on-demand mobile back covers (per phone model, per design, user-uploaded or catalog designs)
- Mobile accessories (tempered glass, cables, chargers, cases, pop grips, etc.)

**Current operating reality (Day 1 state):**

- No warehouse management system (WMS)
- No fulfillment/OMS software
- No courier API integrations (bookings are manual)
- No ERP

Order status is changed **manually by an admin** through an internal dashboard. The system is architected so that every manual status change triggers a full chain of automated downstream effects (DB update, customer dashboard update, tracking timeline update, email, WhatsApp, audit log) — giving customers an automated *experience* even though fulfillment operations are manual today.

The architecture explicitly anticipates a future where couriers (Leopard, TCS, BlueEx, M&P, DHL, FedEx) are integrated via a `ShippingProvider` abstraction, without requiring a rewrite.

---

## 2. Documentation Map

| # | Document | Purpose |
|---|----------|---------|
| 1 | `README.md` | This file — entry point and navigation |
| 2 | `PRD.md` | Product requirements: goals, personas, journeys, features, scope |
| 3 | `SYSTEM_ARCHITECTURE.md` | High-level and component architecture, diagrams, data flow |
| 4 | `DATABASE_ARCHITECTURE.md` | Schema, ERD, Prisma models, indexing, migrations |
| 5 | `DESIGN_SYSTEM_REQUIREMENTS.md` | UI/UX system: tokens, components, Shadcn conventions, accessibility |
| 6 | `ORDER_MANAGEMENT_SYSTEM.md` | Order lifecycle, status state machine, admin operations |
| 7 | `ORDER_TRACKING_SYSTEM.md` | Customer-facing tracking timeline, tracking events, public tracking page |
| 8 | `EMAIL_AUTOMATION_ARCHITECTURE.md` | Resend integration, templates, triggers, retries |
| 9 | `WHATSAPP_AUTOMATION_ARCHITECTURE.md` | Meta WhatsApp Cloud API integration, templates, opt-in/opt-out |
| 10 | `TESTING_STRATEGY.md` | Playwright E2E, unit/integration testing, CI gating |
| 11 | `DEPLOYMENT_GUIDE.md` | Vercel deployment, environments, secrets, release process |
| 12 | `SECURITY_GUIDE.md` | AuthN/AuthZ, data protection, threat model, compliance |
| 13 | `GITHUB_WORKFLOW.md` | Branching model, PR process, commit conventions, CI/CD |
| 14 | `FUTURE_SCALING_ROADMAP.md` | Courier integrations, ERP, warehouse, multi-region scaling |

Read in this order for onboarding: **README → PRD → SYSTEM_ARCHITECTURE → DATABASE_ARCHITECTURE → ORDER_MANAGEMENT_SYSTEM → ORDER_TRACKING_SYSTEM → EMAIL/WHATSAPP → TESTING → DEPLOYMENT → SECURITY → GITHUB_WORKFLOW → FUTURE_SCALING_ROADMAP → DESIGN_SYSTEM_REQUIREMENTS** (design system can be read any time, in parallel with frontend work).

---

## 3. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS |
| UI Components | Shadcn UI (Radix primitives) |
| Backend | Next.js Server Actions (no separate REST/GraphQL server for core app) |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Clerk (customers + admin, role-based) |
| Transactional Email | Resend |
| Messaging | Meta WhatsApp Cloud API |
| Hosting/Infra | Vercel (Edge + Serverless Functions, Vercel Postgres or Neon/Supabase-compatible Postgres) |
| E2E Testing | Playwright |
| CI/CD | GitHub Actions + Vercel Git integration |

---

## 4. Core Architectural Principles

1. **Admin-driven, system-automated.** A human changes order status; the system guarantees every downstream side effect happens atomically and reliably (via a transactional outbox pattern — see `SYSTEM_ARCHITECTURE.md`).
2. **Abstraction before integration.** Shipping, email, and WhatsApp are all implemented behind provider-agnostic interfaces so vendors can be swapped or added (e.g., courier APIs) without touching business logic.
3. **Single source of truth.** PostgreSQL via Prisma is the system of record for orders, tracking, and audit history. Email/WhatsApp logs reference — never replace — DB state.
4. **Idempotency everywhere.** All notification sends and status transitions are idempotent to survive retries, webhook duplication, and admin double-clicks.
5. **Auditable by default.** Every state change writes an immutable audit log entry; nothing is silently overwritten.
6. **Future-proof, not over-engineered.** No premature microservices, no premature ERP. The monolith (Next.js) is modular internally so it can be decomposed later (see `FUTURE_SCALING_ROADMAP.md`).

---

## 5. Repository Structure (Documentation Set)

```
docs/
├── README.md
├── PRD.md
├── SYSTEM_ARCHITECTURE.md
├── DATABASE_ARCHITECTURE.md
├── DESIGN_SYSTEM_REQUIREMENTS.md
├── ORDER_MANAGEMENT_SYSTEM.md
├── ORDER_TRACKING_SYSTEM.md
├── EMAIL_AUTOMATION_ARCHITECTURE.md
├── WHATSAPP_AUTOMATION_ARCHITECTURE.md
├── TESTING_STRATEGY.md
├── DEPLOYMENT_GUIDE.md
├── SECURITY_GUIDE.md
├── GITHUB_WORKFLOW.md
└── FUTURE_SCALING_ROADMAP.md
```

For the actual application folder structure, see `SYSTEM_ARCHITECTURE.md § Folder Structure`.

---

## 6. Ownership & Maintenance

| Document | Primary Owner |
|---|---|
| PRD, README | Product Manager |
| System/Database Architecture | Solution Architect / CTO |
| Design System | Design Lead / Frontend Lead |
| Order Management / Tracking | Product + Backend Lead |
| Email/WhatsApp Automation | Backend Lead |
| Testing Strategy | QA Lead |
| Deployment, Security, GitHub Workflow | DevOps / CTO |
| Future Scaling Roadmap | CTO |

All documents are living documents. Any architectural decision that deviates from these docs must be captured as an ADR (Architecture Decision Record) — see `SYSTEM_ARCHITECTURE.md § ADR Process`.
