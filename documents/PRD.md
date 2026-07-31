# Product Requirements Document (PRD)
## CoverCraft — Custom Mobile Covers & Accessories Platform

**Version:** 1.0
**Status:** Approved for Build
**Owner:** Product Management

---

## 1. Executive Summary

CoverCraft is a premium D2C ecommerce platform for custom-printed mobile back covers and mobile accessories. The product must deliver a best-in-class shopping and customization experience on the frontend, while operating on a **lean, manual-fulfillment backend** at launch — no WMS, no ERP, no courier API. The system compensates for manual fulfillment by automating everything *around* the manual action: notifications, tracking, dashboards, and audit trails.

---

## 2. Business Goals

| Goal | Metric |
|---|---|
| Launch a premium, trustworthy DTC brand experience | Design system consistency, <2.5s LCP, mobile-first |
| Enable custom cover design at scale | Support N phone models × N designs × user uploads |
| Reduce customer support load via self-serve tracking | ≥60% of "where is my order" queries resolved via tracking page/WhatsApp, not human support |
| Increase repeat purchase via trust & communication | Automated status emails/WhatsApp on every order stage |
| Keep operational overhead low pre-PMF | Zero dependency on warehouse/ERP software at launch |
| Be integration-ready without rebuilding | Add a courier in <2 weeks via `ShippingProvider` interface |

---

## 3. Personas

### 3.1 Customer — "Ayesha, 24, Online Shopper"
- Buys via Instagram ads and word of mouth.
- Wants to preview her custom design before ordering.
- Anxious about order status; checks WhatsApp more than email.
- Expects real-time-feeling updates even if fulfillment is manual behind the scenes.

### 3.2 Admin/Ops User — "Bilal, Store Operator"
- Non-technical, manages 20–200 orders/day manually.
- Needs a dead-simple dashboard: change status → done.
- Should never need to manually send an email or WhatsApp message — the system does it.
- Needs an audit trail to resolve disputes ("I never got my order marked Shipped").

### 3.3 Business Owner/Founder — "Sana, CEO"
- Cares about brand perception, conversion rate, and repeat purchase.
- Needs visibility into order funnel and status distribution.
- Plans to add couriers and possibly a warehouse team within 6–12 months.

### 3.4 Future Persona — "Warehouse Staff" (Phase 2+)
- Not present at launch. Roadmap anticipates barcode/scan-based packing once volume justifies it (see `FUTURE_SCALING_ROADMAP.md`).

---

## 4. User Journeys

### 4.1 Customer Purchase Journey
1. Browse catalog → filter by phone model/brand.
2. Select cover → enter Designer (upload image / choose template / adjust crop, text, filters).
3. Preview render → Add to Cart.
4. Checkout: shipping address, contact number (required for WhatsApp), payment (COD or online).
5. Order Confirmation page + Email + WhatsApp confirmation.
6. Customer visits **My Orders** or public **Track Order** page anytime.
7. Receives automatic Email + WhatsApp at every status change.
8. Order delivered → optional review/reorder prompt.

### 4.2 Admin Order Fulfillment Journey
1. Admin logs into `/admin` (Clerk-authenticated, role = `ADMIN` or `STAFF`).
2. Views Orders queue, filters by status (`Pending`, `Confirmed`, ...).
3. Opens an order → reviews items, customer, custom design files.
4. Changes status via dropdown/action button (e.g., `Confirmed` → `Processing`).
5. System instantly:
   - Persists new status + timestamp
   - Appends `TrackingEvent`
   - Appends `AuditLog` entry (who, when, from→to, optional note)
   - Triggers Email job
   - Triggers WhatsApp job
   - Updates customer-facing dashboard/tracking in real time (via revalidation/polling)
6. Admin can add an optional note (e.g., courier tracking number once shipped) — surfaced to the customer.

### 4.3 Support Escalation Journey
1. Customer messages support (WhatsApp) asking about order.
2. Support agent (or future chatbot) looks up order by phone number or order ID.
3. Sees full timeline + audit log for accurate response.

---

## 5. Functional Requirements

### 5.1 Storefront
- FR-1: Product catalog with categories (Covers, Accessories), filters (brand, model, price, color).
- FR-2: Product detail page with gallery, price, variant selection (phone model), stock status.
- FR-3: Custom Cover Designer: image upload, template gallery, text overlay, live preview, save design to cart item.
- FR-4: Cart with editable quantities, design thumbnails, price breakdown (subtotal, shipping, tax, discount).
- FR-5: Checkout: address form, phone number (mandatory, E.164 validated for WhatsApp), payment method selection.
- FR-6: Order confirmation page with Order ID and initial tracking link.
- FR-7: Customer account area ("My Orders") — list + detail with live tracking timeline.
- FR-8: Public order tracking page accessible via Order ID + phone/email (no login required).

### 5.2 Admin Panel
- FR-9: Secure admin login (Clerk, role-gated: `ADMIN`, `STAFF`, `SUPPORT` read-only).
- FR-10: Orders list with search/filter/sort by status, date, customer.
- FR-11: Order detail view: items, custom design assets (downloadable), customer info, current status, full history.
- FR-12: Manual status change control restricted to the defined 9-state lifecycle (see `ORDER_MANAGEMENT_SYSTEM.md`).
- FR-13: Optional admin note + optional external reference field (e.g., manual courier tracking number/slip) per status change.
- FR-14: Bulk status update (select multiple orders → same transition) for operational efficiency.
- FR-15: Audit log viewer per order (immutable, timestamped, actor-attributed).
- FR-16: Product & catalog management (CRUD products, variants, pricing, stock).
- FR-17: Design template management (upload/curate templates available in the Designer).

### 5.3 Notification System
- FR-18: On every status transition, system automatically sends Email (Resend) and WhatsApp (Meta Cloud API) using status-specific templates.
- FR-19: Notification failures are logged and retried (see `EMAIL_AUTOMATION_ARCHITECTURE.md`, `WHATSAPP_AUTOMATION_ARCHITECTURE.md`); failures never block the status update itself.
- FR-20: Customers can opt out of WhatsApp (fallback to email-only) per applicable regulations.

### 5.4 Tracking System
- FR-21: Every status change creates a `TrackingEvent` with timestamp, status, human-readable message, and optional location/note.
- FR-22: Tracking timeline UI (vertical stepper) reflects the 9-state lifecycle, showing completed/current/pending/cancelled states.
- FR-23: Tracking page must work for guest users via Order ID + verification (phone last 4 digits or email).

### 5.5 Non-Functional callouts
(Full detail in respective architecture docs.)
- NFR reference → Security (`SECURITY_GUIDE.md`), Performance/Scaling (`FUTURE_SCALING_ROADMAP.md`), Testing (`TESTING_STRATEGY.md`).

---

## 6. Out of Scope (v1)

- Automated courier booking/label generation.
- Warehouse pick/pack/scan software.
- ERP/accounting integration.
- Multi-warehouse inventory routing.
- Real-time courier GPS tracking (only manual admin-entered milestones).
- Marketplace channels (Amazon/Daraz) — storefront only.

These are explicitly planned for later phases; see `FUTURE_SCALING_ROADMAP.md`.

---

## 7. Success Metrics (KPIs)

| KPI | Target (Launch +90 days) |
|---|---|
| Checkout conversion rate | ≥ 2.5% |
| Cart abandonment | < 70% |
| Avg. time to first status update (Pending→Confirmed) | < 24h |
| Notification delivery success rate (email) | ≥ 98% |
| Notification delivery success rate (WhatsApp) | ≥ 95% |
| Support tickets re: "order status" | < 15% of total orders |
| Core Web Vitals (LCP/CLS/INP) | Pass "Good" threshold on 90% of page loads |

---

## 8. Assumptions & Constraints

- Single currency, single country launch (extensible later — see roadmap).
- COD (Cash on Delivery) and one online payment gateway supported at launch.
- Admin team size: 1–5 users at launch.
- Order volume at launch: low-to-medium (<500 orders/day), justifying manual status management.
- WhatsApp Business number and Meta Business verification assumed complete before launch (operational dependency, not engineering).

---

## 9. Release Plan (High Level)

| Phase | Scope |
|---|---|
| Phase 0 | Design system, auth, catalog, cart, checkout |
| Phase 1 (Launch) | Full order lifecycle, tracking, email + WhatsApp automation, admin panel |
| Phase 2 | Courier abstraction layer live with 1 courier (e.g., Leopard) in "assist mode" (admin still confirms) |
| Phase 3 | Full courier API automation, warehouse tooling, ERP integration |

Detailed phase breakdown in `FUTURE_SCALING_ROADMAP.md`.
