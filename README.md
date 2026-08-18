# CoverCraft — Mobile Back Cover Shop

Full e-commerce store for the Pakistani market: browse and buy mobile covers, design your own
custom cover in-browser, customer accounts, **EasyPaisa** checkout with email verification,
an admin operations dashboard, order tracking, and automated email + WhatsApp notifications.

Built with **Next.js 14 (App Router)**, **Prisma + PostgreSQL (Supabase)**, and **Tailwind CSS**.

## What's built

- 🛍️ **Storefront** — responsive catalogue with search, brand/price filters, category shortcuts, and product detail pages
- 🎨 **Custom cover designer** — fabric.js canvas: pick a phone model, add text/photos/emoji, colours, fonts and effects; the preview is saved with the order
- 👤 **Customer accounts** — signup/login (bcrypt + JWT httpOnly cookies), profile, saved addresses, order history, and self-service order cancellation
- 💚 **Wishlist** — save covers to your account and add them to the cart later
- 🛒 **Cart + EasyPaisa checkout** — every checkout is confirmed with a **6-digit email code (OTP)** before payment, then handed off to EasyPaisa's Hosted Checkout page
- 📦 **Stock control** — standard-product stock is reserved at checkout and released automatically if payment is never completed (scheduled cron)
- 📊 **Admin dashboard** — sales analytics, order management, order-status updates (auto-WhatsApps the customer), shipment/courier assignment, product & custom-cover template management, and emailed monthly reports
- 🚚 **Order tracking** — public tracking page by order number, with a live timeline
- 💬 **Support** — complaint/feedback form + inbound WhatsApp webhook, both notify the admin
- 🗄️ **Prisma schema** for Products, Orders, OrderItems, Customers, Addresses, Wishlist, TrackingEvents, Payments, Complaints, Admin, and audit/notification tables

## Payments at a glance

Checkout is in **PKR via EasyPaisa Hosted Checkout**. The flow is intentionally two-step:

1. Customer fills in shipping details and requests a code → a 6-digit OTP is emailed (hashed & time-limited; the code is never returned in the API response).
2. Customer enters the code → on success a short-lived checkout ticket is issued and the browser is redirected to EasyPaisa to pay.

On EasyPaisa's callback the order is confirmed, stock is converted from reserved to sold, and the customer + admin are notified. If credentials are missing, the code path degrades gracefully rather than crashing.

## Prerequisites

- Node.js 18.17+ and npm
- A PostgreSQL database (Supabase free tier works well)
- Accounts for the services you want live: EasyPaisa (payments), Resend (email), Meta WhatsApp Cloud API (notifications). Each degrades gracefully if unconfigured, so you can run the store locally before wiring them all up.

## 1. Install

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the values. See [`.env.example`](.env.example) for every variable with inline guidance. The essentials to start:

- `DATABASE_URL` / `DIRECT_URL` — your Supabase Postgres connection strings
- `JWT_SECRET` — a random string of 32+ characters
- `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` — used once by the seed to create your admin login (password must be 12+ characters; there is **no** hardcoded default)
- `NEXT_PUBLIC_BASE_URL` — `http://localhost:3000` for local dev

EasyPaisa, Resend and WhatsApp values can be added when you're ready to test those flows.

## 3. Create the database schema + admin user

```bash
npx prisma generate
npx prisma migrate deploy   # or: npx prisma migrate dev   (local development)
npx prisma db seed
```

The seed reads `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` from `.env`, hashes the password (bcrypt, cost 12), and creates the admin account. It refuses to run if the password is missing or under 12 characters.

## 4. Run locally

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Customer account: http://localhost:3000/account
- Admin login: http://localhost:3000/admin

## 5. Test the full flow

1. Sign up for a customer account → browse → open a product → (optionally) design a custom cover → add to cart.
2. In the cart, fill in shipping details → **Continue to secure checkout** → a 6-digit code is emailed → enter it → **Confirm & Pay with EasyPaisa**.
3. Complete the sandbox payment on EasyPaisa's hosted page. On return you land on `/checkout/success` and the order appears in `/admin/dashboard`.
4. Change the order status in the admin dashboard → the customer's WhatsApp gets an update (if WhatsApp is configured).
5. Visit `/track?order=YOUR-ORDER-NUMBER` for the tracking timeline.
6. Test a failed/abandoned payment → you land on `/checkout/failed`, the order shows FAILED, and reserved stock is released.

> **Email note:** OTP codes are sent via Resend. Without `RESEND_API_KEY` configured, email sending is a safe no-op — check the server logs, or configure Resend to receive real codes.

## 6. Add real products

Manage products and custom-cover templates directly in the **admin dashboard**, or edit the `Product` table in Supabase. Prices are stored **in paisas** (Rs × 100), e.g. Rs 1,200 → `120000`. Product images can be uploaded through the admin panel (requires the optional Supabase Storage variables) or referenced by URL.

## 7. Deploy to Vercel

1. Push the project to GitHub and import it at https://vercel.com.
2. Add every variable from `.env` into Vercel's **Environment Variables**. Set `NEXT_PUBLIC_BASE_URL` to your real domain — EasyPaisa uses it to build the payment return URL.
3. Set a **`CRON_SECRET`** (see below) so the reservation-cleanup cron is authenticated.
4. Deploy. Then point the WhatsApp webhook at `https://YOUR_DOMAIN/api/whatsapp/webhook` (verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages`).

EasyPaisa needs no separate webhook registration — it calls the return URL (`/api/easypaisa/callback`) built from `NEXT_PUBLIC_BASE_URL` on each transaction.

## Scheduled job — reservation cleanup

Checkout reserves standard-product stock up front. If a buyer abandons payment, [`vercel.json`](vercel.json) runs `GET /api/maintenance/release-reservations` every 15 minutes to release stock held by UNPAID orders older than 30 minutes.

- The endpoint requires `Authorization: Bearer $CRON_SECRET`. Vercel Cron sends this header automatically when a `CRON_SECRET` environment variable is set.
- **Vercel plan caveat:** Vercel's **Hobby (free)** plan limits cron jobs to **once per day**. The `*/15 * * * *` schedule needs the **Pro** plan. On Hobby, either accept daily cleanup, reduce the schedule to daily, or trigger the endpoint from an external scheduler (e.g. cron-job.org) with the same Bearer secret.

## Full setup walkthrough

See [`docs/SETUP-GUIDE.md`](docs/SETUP-GUIDE.md) for a step-by-step account-by-account guide, and [`docs/MANUAL_CONFIGURATION.md`](docs/MANUAL_CONFIGURATION.md) for the production configuration checklist.

## Tech notes

- Prices are integers in paisas everywhere; format for display as `Rs. {(price/100).toLocaleString()}`.
- Auth middleware runs on the Edge runtime and decodes JWTs without Node crypto.
- The custom-cover preview is a fabric.js `toDataURL()` data URL, so those two preview images intentionally use a plain `<img>` (Next Image cannot render data URLs).
- Run `npx tsc --noEmit` to type-check and `npm run build` to verify the production build.
