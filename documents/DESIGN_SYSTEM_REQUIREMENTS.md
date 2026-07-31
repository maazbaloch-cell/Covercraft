# Design System Requirements
## CoverCraft Platform — Frontend UI/UX Standards

**Owner:** Design Lead / Frontend Lead
**Stack:** TailwindCSS + Shadcn UI (Radix primitives) + Next.js 15

---

## 1. Design Philosophy

CoverCraft is a **premium** brand — the design system must communicate quality, trust, and craftsmanship, not "generic ecommerce template." Priorities:

1. **Clarity over decoration** — every screen (especially checkout and tracking) must reduce anxiety, not add it.
2. **Consistency** — one set of tokens, one component library, no ad-hoc one-off styles.
3. **Mobile-first** — the majority of traffic is mobile; the Designer tool especially must work flawlessly on small screens.
4. **Accessible by default** — WCAG 2.1 AA minimum.

---

## 2. Design Tokens

### 2.1 Color System (Tailwind config extension)

| Token | Usage |
|---|---|
| `brand-primary` | Primary CTAs, links, active states |
| `brand-secondary` | Accent highlights, badges |
| `neutral-950 … neutral-50` | Text, backgrounds, borders (grayscale ramp) |
| `success-500` | Delivered, Confirmed states |
| `warning-500` | Pending, Processing states |
| `info-500` | Shipped, Out for Delivery |
| `danger-500` | Cancelled, errors, destructive actions |

All status colors map 1:1 to `OrderStatus` values (see `ORDER_TRACKING_SYSTEM.md § Status Color Mapping`) — colors must be defined **once** in `lib/constants/status.ts` and consumed everywhere (badges, timeline, emails) to avoid drift.

### 2.2 Typography

| Role | Font weight/size | Usage |
|---|---|---|
| Display | 700, 2.25–3rem | Hero, campaign banners |
| H1–H3 | 600–700 | Page/section titles |
| Body | 400, 1rem | Default copy |
| Small/Caption | 400, 0.875rem | Metadata, timestamps, helper text |

Font: a single premium sans-serif (e.g., Inter or Satoshi) loaded via `next/font` for zero layout shift.

### 2.3 Spacing & Radius

- Spacing scale: Tailwind default (`4px` base unit).
- Border radius: `rounded-lg` (8px) as default for cards/buttons/inputs — consistent "soft premium" feel; avoid mixing sharp and pill shapes arbitrarily.

### 2.4 Elevation

- Use Tailwind `shadow-sm`/`shadow-md` sparingly — premium brands favor whitespace and borders over heavy drop shadows.

---

## 3. Component Library (Shadcn UI Conventions)

All components are generated via Shadcn CLI into `components/ui/` and customized minimally (only tokens, not structure) to ease future upstream updates.

### 3.1 Required Base Components
`Button`, `Input`, `Textarea`, `Select`, `Dropdown Menu`, `Dialog`, `Sheet` (mobile drawers), `Tabs`, `Badge`, `Card`, `Table`, `Toast/Sonner`, `Skeleton`, `Avatar`, `Separator`, `Accordion`, `Form` (with `react-hook-form` + `zod`).

### 3.2 Domain-Specific Composite Components

| Component | Location | Purpose |
|---|---|---|
| `<OrderStatusBadge status />` | `components/shared/` | Renders color-coded badge for any of the 9 statuses; single source of truth for status labels/colors |
| `<TrackingTimeline events />` | `components/storefront/` | Vertical stepper showing all 9 lifecycle stages, marking completed/current/future/cancelled |
| `<CoverDesigner />` | `components/storefront/` | Canvas-based (Konva/Fabric.js) upload + template + text overlay editor |
| `<AdminOrderStatusControl />` | `components/admin/` | Guarded dropdown that only allows valid next-transitions per the state machine |
| `<AuditLogTable />` | `components/admin/` | Read-only table of audit entries per order |
| `<ProductVariantSelector />` | `components/storefront/` | Phone model/color picker with stock-aware disabling |

### 3.3 Component Rules

- No component may hardcode business logic (e.g., "if status === SHIPPED show truck icon") outside of the single `status.ts` config map.
- All interactive components must support keyboard navigation and visible focus rings (Radix gives this by default — do not override `outline: none` without a replacement focus style).
- Loading states use `Skeleton`, never blank screens or layout shift.

---

## 4. Layout System

- **Storefront:** max content width `1280px`, 16px/24px gutter (mobile/desktop), sticky header with cart icon + order count.
- **Admin:** sidebar navigation (collapsible on mobile/tablet), top bar with role indicator and quick search (Order ID/phone/email).
- **Grid:** Tailwind CSS Grid/Flex utilities only — no custom grid CSS files.

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| `sm` | 640px | Cover Designer switches to single-column tool layout |
| `md` | 768px | Admin sidebar becomes persistent |
| `lg` | 1024px | Catalog grid: 4 columns |
| `xl` | 1280px | Max content container |

---

## 6. Accessibility Requirements

- WCAG 2.1 AA color contrast on all text/background pairs, including status badges.
- All forms (checkout, designer) have associated `<label>`s, error messages announced via `aria-live`.
- Tracking timeline uses semantic list markup (`<ol>`) with `aria-current="step"` on the active status.
- Designer tool provides a non-canvas fallback description for screen readers (canvas content is inherently inaccessible; provide text alternative of current design state).
- All interactive elements meet 44×44px minimum touch target on mobile.

---

## 7. Design-to-Notification Consistency

Email and WhatsApp templates (see `EMAIL_AUTOMATION_ARCHITECTURE.md`, `WHATSAPP_AUTOMATION_ARCHITECTURE.md`) must visually echo the web design system: same brand colors (within HTML-email-safe constraints), same status terminology, same logo/header treatment — so customers experience one coherent brand across web, email, and WhatsApp.

---

## 8. Design System Governance

- Any new UI pattern used more than twice must be extracted into `components/shared/` and documented here.
- Design tokens live in `tailwind.config.ts` under `theme.extend` — never inline hex codes in components.
- A living Storybook (or Ladle, for lighter footprint) is recommended for Phase 2 to visually catalog all components; not required for launch but referenced in `FUTURE_SCALING_ROADMAP.md`.
