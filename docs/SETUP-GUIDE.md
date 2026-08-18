# CoverCraft — Go-Live Setup Guide (EasyPaisa Edition)
### Step-by-step: from downloaded code → fully working, deployed website

This guide assumes you already have the `mobile-cover-shop` project unzipped and open in VS Code.
Follow the steps **in order** — each one unlocks the next.

---

## PART A — Accounts & Credentials

### A1. Supabase (Database)
1. Go to **https://supabase.com** → **Start your project** → sign up (Google or email)
2. Click **New Project**
   - Name: `covercraft`
   - Database Password: create a strong password → **save it, you'll need it again**
   - Region: pick the closest to you (Singapore is usually fastest from Pakistan)
3. Wait ~2 minutes for it to provision
4. Go to **Project Settings (gear icon) → Database → Connection string → URI**
5. Copy the string. It looks like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password from step 2. This is your `DATABASE_URL`.
   For `DIRECT_URL`, use the direct (non-pooler) connection string from the same page.

**✅ Checkpoint:** You have a full `postgresql://...` connection string copied.

---

### A2. EasyPaisa (Payments)
EasyPaisa Hosted Checkout has **two separate tracks** — don't confuse them:

**Track 1 — Sandbox/staging (for testing, do this first)**
1. Request sandbox access through your EasyPaisa / Telenor Microfinance Bank merchant contact,
   or the EasyPaisa merchant portal, and ask for **Hosted Checkout** test credentials.
2. You'll receive sandbox values for:
   - **Store ID**
   - **Hash key** (the AES key used to sign and verify the request/response)
   - The **enabled payment method** for your store (e.g. `MA_PAYMENT_METHOD` for mobile
     account, or `OTC_PAYMENT_METHOD` for over-the-counter)
3. These are sandbox-only credentials — safe to test with, no real money moves.

**Track 2 — Live/Production (requires approval, do this only when ready to accept real payments)**
1. Complete EasyPaisa merchant onboarding — you'll typically need:
   - CNIC (ID card)
   - Business bank account details
   - Business registration documents (if registered) or your sole-proprietor details
2. EasyPaisa reviews and approves the merchant account.
3. On approval you receive **live** Store ID and hash key, and they confirm your **live
   Hosted Checkout endpoint** — these are different from sandbox.

**✅ Checkpoint (for now):** You have a sandbox Store ID, hash key, and know your enabled payment method.

> The store degrades gracefully if EasyPaisa isn't configured yet, so you can build and browse
> locally before these are in place — you just can't complete a real payment until they are.

---

### A3. Resend (Email automation — also powers checkout codes)
1. Go to **https://resend.com** → sign up free
2. Go to **API Keys → Create API Key** → name it `covercraft` → copy the key (starts with `re_...`)
3. While testing, use `onboarding@resend.dev` as your sending address (no domain verification
   needed yet — see Part G to upgrade this later)

**✅ Checkpoint:** You have a `re_...` key copied.

> Resend does double duty: it sends order confirmations **and** the 6-digit checkout
> verification code (OTP). Without it configured, code sending is a safe no-op and the code is
> written to the server log instead — fine for local testing, but real email is required for customers.

---

### A4. Meta WhatsApp Cloud API (WhatsApp automation)
1. Go to **https://developers.facebook.com** → log in with Facebook → **My Apps → Create App**
2. Choose app type: **Business** → name it `CoverCraft`
3. On the app dashboard, find **WhatsApp** in the product list → click **Set up**
4. On **WhatsApp → API Setup** you'll see:
   - A **Temporary access token** (valid 24h while testing) → copy it
   - A **Phone number ID** → copy it
5. Under "To", add your own number (in the format `923001234567`) as a test recipient → verify
   via the code Meta sends
6. Send yourself a test message from that page to confirm it works

**✅ Checkpoint:** You have an access token and phone number ID copied, and received a test WhatsApp message.

> ⚠️ This token expires every 24 hours. Once everything else works, follow **Part G** to get a permanent one.

---

## PART B — Fill In Your Project

1. In VS Code's terminal:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in everything from Part A. See [`.env.example`](../.env.example) for the
   full list with inline notes; the essentials are:

   ```env
   DATABASE_URL="paste your Supabase pooler URI here"
   DIRECT_URL="paste your Supabase direct URI here"

   EASYPAISA_STORE_ID="paste your sandbox Store ID"
   EASYPAISA_HASH_KEY="paste your sandbox hash key"
   EASYPAISA_ENV="sandbox"
   EASYPAISA_PAYMENT_METHOD="MA_PAYMENT_METHOD"
   # EASYPAISA_CHECKOUT_URL=""   # only set if EasyPaisa gave you a custom endpoint

   RESEND_API_KEY="paste re_... here"
   ADMIN_EMAIL="you@example.com"
   EMAIL_FROM="onboarding@resend.dev"

   WHATSAPP_PHONE_NUMBER_ID="paste phone number ID here"
   WHATSAPP_ACCESS_TOKEN="paste access token here"
   ADMIN_WHATSAPP_NUMBER="923001234567"
   WHATSAPP_VERIFY_TOKEN="make up any random word, e.g. covercraft2026"

   JWT_SECRET="a long random string of 32+ characters"
   ADMIN_INITIAL_PASSWORD="a unique password of at least 12 characters"
   CRON_SECRET="another long random string"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```
3. Save the file.

**✅ Checkpoint:** No placeholder values left in `.env`. `ADMIN_INITIAL_PASSWORD` is at least
12 characters (the seed refuses to run otherwise), and `JWT_SECRET` is long and random.

---

## PART C — Install & Initialize

Run one at a time in the VS Code terminal:

```bash
npm install
```
```bash
npx prisma generate
```
```bash
npx prisma migrate dev --name init
```
```bash
npx prisma db seed
```

The seed reads `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` from your `.env`, hashes the password
(bcrypt, cost 12), and creates your admin login. **There is no hardcoded default password** — your
admin password is exactly the `ADMIN_INITIAL_PASSWORD` you chose in Part B.

Now start the app:
```bash
npm run dev
```

- **Storefront:** http://localhost:3000
- **Customer account:** http://localhost:3000/account
- **Admin login:** http://localhost:3000/admin — log in with `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD`

**✅ Checkpoint:** Site loads locally, customer signup works, admin login works.

---

## PART D — Test the Full Order Flow (local, sandbox — safe)

1. **Create a customer account:** go to http://localhost:3000/account → sign up with your email.
2. **Browse and (optionally) customise:** open a product → add to cart, or open the custom-cover
   designer, design a cover, and add that to the cart. Tap the ♥ on any product to save it to your
   **wishlist** and confirm it appears under your account.
3. **Start checkout:** in the cart, fill in your shipping details (use a real phone number in the
   format `923001234567` so WhatsApp automation can reach it) → click **Continue to secure checkout**.
4. **Verify by email (OTP):** a 6-digit code is emailed to you ("We emailed a 6-digit code to …").
   Enter it and click **Confirm & Pay with EasyPaisa**. *(Without Resend configured, the code is
   printed in the server terminal instead — copy it from there for local testing.)*
5. **Pay on EasyPaisa sandbox:** you're redirected to EasyPaisa's hosted payment page. Complete the
   payment using EasyPaisa's sandbox test instructions from your merchant onboarding pack.
6. **Confirm the success path:**
   - ✅ Redirected to `/checkout/success` with your order number showing
   - ✅ Order shows in `/admin/dashboard` with status **PAID**
   - ✅ Confirmation email arrives (check spam too)
   - ✅ WhatsApp message arrives on your phone (if WhatsApp is configured)
   - ✅ For a standard product, stock decreased by the quantity ordered
7. In the admin dashboard, **change the order status** → confirm the customer's WhatsApp gets a status update.
8. Go to `/track?order=YOUR-ORDER-NUMBER` → confirm the tracking timeline shows.
9. **Test the failure path:** start another checkout and abandon or decline the EasyPaisa payment →
   confirm you land on `/checkout/failed`, the order shows **FAILED**, and any reserved standard-product
   stock is released (either immediately on the failure callback, or by the cleanup cron for abandoned checkouts).
10. **Test cancellation:** from the customer dashboard, cancel an eligible order → confirm it moves to
    CANCELLED and reserved stock is returned.

**✅ Checkpoint:** A full test order works end-to-end — signup, wishlist, OTP verification, payment,
admin status update, tracking, and both the failure and cancellation stock-restore paths.

---

## PART E — Add Your Real Products

You have a proper admin UI for this — no need to edit the database by hand:

1. Log in at `/admin` → open the **dashboard**.
2. Use the **product management** section to add or edit products and custom-cover templates:
   `title`, `description`, `category`, price, and an image.
3. **Prices are in paisas** (Rs × 100): Rs 1,200 → `120000`.
4. **Images:** upload directly through the admin panel (requires the optional Supabase Storage
   variables — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`),
   or reference an existing image URL.
5. Refresh the shop page — your real products appear.

*(You can still edit the `Product` table directly in Supabase if you prefer, but the admin UI is the intended path.)*

**✅ Checkpoint:** Real designs with real photos and PKR prices show on the shop page.

---

## PART F — Deploy to Vercel (go live)

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Create a repo on github.com, then:
   ```bash
   git remote add origin https://github.com/yourusername/mobile-cover-shop.git
   git push -u origin main
   ```
2. Go to **https://vercel.com** → sign up (GitHub login) → **Add New Project** → import your repo
3. Before deploying, add **every** variable from `.env` into **Environment Variables**, with these changes:
   ```
   NEXT_PUBLIC_BASE_URL = https://your-project-name.vercel.app
   ```
   (EasyPaisa needs this correct — it builds your payment **return URL** from it)
   Also make sure **`CRON_SECRET`** is set — it authenticates the reservation-cleanup cron.
4. Click **Deploy**
5. Update the WhatsApp webhook to point at your real domain:
   - Meta Developer App → WhatsApp → Configuration → Webhook
   - Callback URL: `https://your-project-name.vercel.app/api/whatsapp/webhook`
   - Verify token: same value as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the `messages` field
6. EasyPaisa needs **no separate webhook setup** — it uses the return URL
   (`/api/easypaisa/callback`) built from `NEXT_PUBLIC_BASE_URL` on each transaction, so nothing
   extra to configure there once step 3 is correct.

> **Cron plan caveat:** [`vercel.json`](../vercel.json) schedules the reservation-cleanup job every
> 15 minutes. Vercel's **Hobby (free)** plan runs cron **at most once per day** — the `*/15` schedule
> needs the **Pro** plan. On Hobby, either accept daily cleanup, change the schedule to daily, or
> trigger `/api/maintenance/release-reservations` from an external scheduler (e.g. cron-job.org)
> sending `Authorization: Bearer <your CRON_SECRET>`.

**✅ Checkpoint:** Site is live on a real URL, WhatsApp webhook points at it, and a sandbox test
order still works end-to-end on the live URL.

---

## PART G — Before Accepting Real Payments

- Get your **live EasyPaisa merchant account approved** (Part A2, Track 2) → replace the sandbox
  Store ID / hash key in Vercel's environment variables with live ones, confirm the live checkout
  endpoint, and set `EASYPAISA_ENV=production`.
- **Verify a real domain on Resend** (Settings → Domains) so emails don't land in spam → update
  `EMAIL_FROM` to an address at that domain. This matters for both order emails and checkout OTP codes.
- Get a **permanent WhatsApp access token**: Meta Business Settings → System Users → create a system
  user → generate a token with `whatsapp_business_messaging` permission (doesn't expire like the 24h
  test token). Create and get approval for any business-initiated message templates you need.
- **Rotate the admin password.** Customer accounts already have a self-service change-password screen;
  the admin password was set once from `ADMIN_INITIAL_PASSWORD` at seed time. To change it, update
  `ADMIN_INITIAL_PASSWORD` and re-run the seed against your database, or update the bcrypt hash in the
  Admin table directly. Never leave the initial value in place for a live store.
- Confirm **`CRON_SECRET`** is set in production and the reservation-cleanup schedule is active.
- Do one final **real-money test transaction** for a small amount once live, to confirm everything
  works exactly as it did in sandbox.

---

## API/Service Summary Reference

| Service | Purpose | Where to sign up | Free tier limit |
|---|---|---|---|
| Supabase | Database (orders, products, customers, admin) | supabase.com | 500MB DB, plenty for a small shop |
| EasyPaisa | Accept customer payments (Hosted Checkout) | EasyPaisa merchant onboarding | Sandbox for testing; live has per-transaction fees |
| Resend | Order emails **and** checkout verification codes | resend.com | 3,000 emails/month free |
| Meta WhatsApp Cloud API | Send/receive WhatsApp automation | developers.facebook.com | 1,000 free service conversations/month |
| Vercel | Hosting/deployment (+ cron) | vercel.com | Free for personal/small projects; `*/15` cron needs Pro |

---

## Quick Troubleshooting

| Problem | Likely cause |
|---|---|
| Redirect to EasyPaisa fails / blank page | Check `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, and `EASYPAISA_PAYMENT_METHOD` are all filled correctly in `.env` |
| "Payment failed" immediately, no EasyPaisa page shown | Hash mismatch — double-check the hash key has no extra spaces/quotes, and that the payment method matches your store |
| Never receive the 6-digit checkout code | `RESEND_API_KEY` missing/wrong (locally the code is printed to the server terminal instead), or check your spam folder |
| "That code didn't work" | Code expired or mistyped — use **Resend code**, then enter the newest one |
| Order stuck as "PENDING"/"UNPAID" after paying | `NEXT_PUBLIC_BASE_URL` doesn't match your real running URL, so EasyPaisa's return URL didn't resolve |
| Reserved stock not released after an abandoned checkout | `CRON_SECRET` not set, or (on Vercel Hobby) cron only runs daily — trigger the cleanup endpoint manually or upgrade the plan |
| No email received | `RESEND_API_KEY` wrong, or check spam folder |
| No WhatsApp received | Access token expired (24h limit) — get a new one from Meta dashboard |
| Admin login fails | Did you run `npx prisma db seed`, and are you using the exact `ADMIN_INITIAL_PASSWORD` from `.env`? |
| Customer login fails | Sign up first at `/account`; passwords are the ones customers set at signup |
| "Order not found" on tracking page | Order number typed wrong, or payment never completed |
| Site won't start (`npm run dev` errors) | Run `npm install` again, check `.env` has no missing quotes |

---

**That's the full path from code to a live, working store.** Work through Parts A–E first
(all free, sandbox-only, zero real money involved) before touching Part F/G.
