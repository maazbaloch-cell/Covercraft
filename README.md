# CoverCraft — Mobile Back Cover Shop

Full e-commerce site: shop with design templates, cart, JazzCash checkout, admin dashboard,
order tracking, and automated email + WhatsApp notifications.

## What's already built
- 🛍️ Shop page — lists all designs/templates with price + "Add to Cart"
- 🛒 Cart + checkout form → JazzCash Hosted Checkout Page
- ✅ JazzCash callback: on payment confirmation → saves order, emails admin + customer, WhatsApps admin
- 📊 Admin dashboard: login, sales totals, order list, update order status (auto-WhatsApps customer)
- 📦 Public order tracking page (by order number)
- 💬 Complaint/feedback: web form + WhatsApp inbound webhook, both notify admin instantly
- 🗄️ Postgres schema (Prisma) for Products, Orders, OrderItems, TrackingEvents, Complaints, Admin

## 1. Install dependencies
```bash
npm install
```

## 2. Set up Supabase (database)
1. Go to https://supabase.com → New Project (free tier)
2. Project Settings → Database → copy the **Connection string (URI)**
3. Paste it into `.env` as `DATABASE_URL`

## 3. Set up JazzCash
1. Go to https://sandbox.jazzcash.com.pk/ → Self-Register to get instant **sandbox** credentials
   (no approval needed for testing) — you'll receive a Merchant ID, Password, and Integrity Salt
2. Paste them into `.env` as `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`
3. Leave `JAZZCASH_ENV=sandbox` until you're ready to go live
4. When ready for real payments: apply for a live JazzCash merchant account at
   https://www.jazzcash.com.pk/business/ (this involves their approval process and business
   documents — separate from the instant sandbox signup), then set `JAZZCASH_ENV=production`
   and swap in your live credentials

## 4. Set up Resend (email)
1. https://resend.com → sign up free → API Keys → create one → paste into `.env`
2. `ADMIN_EMAIL` is already set to your email (maazurrehmanrehman54@gmail.com)
3. `EMAIL_FROM` needs a verified sending domain on Resend. While testing, you can use
   `onboarding@resend.dev` (Resend's free testing address).

## 5. Set up WhatsApp Cloud API (Meta) — free tier
1. https://developers.facebook.com → Create App → add the "WhatsApp" product
2. In WhatsApp → API Setup you'll get a temporary access token + a test phone number ID —
   copy both into `.env` (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)
3. `ADMIN_WHATSAPP_NUMBER` is already set to 923326021815 (your number, international format)
4. Under Configuration → Webhook, set the callback URL to
   `https://yourdomain.com/api/whatsapp/webhook` and the verify token to whatever you put
   in `.env` as `WHATSAPP_VERIFY_TOKEN`. Subscribe to the `messages` field.
   Note: this webhook step only works once deployed (Meta needs a public HTTPS URL) —
   during local dev you can use a tool like `ngrok` to expose localhost temporarily.
5. Meta's test token expires in 24h — once you're ready to go live, verify your business
   and generate a permanent token (still free, no ongoing message costs at low volume).

## 6. Push the database schema + seed sample data
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
This creates your tables and a default admin login:
**maazurrehmanrehman54@gmail.com / ChangeMe123!** — change this password after first login
(there's currently no "change password" UI yet — update it directly in Supabase's table
editor with a new bcrypt hash, or ask me to add a change-password screen).

## 7. Run locally
```bash
npm run dev
```
Visit http://localhost:3000 for the shop, http://localhost:3000/admin for the admin login.

## 8. Test the full flow
1. Add a design to cart → checkout → you'll be redirected to JazzCash's sandbox payment
   page → complete payment using JazzCash's sandbox test wallet/card details (sandbox
   docs give you test mobile account numbers and OTPs to use — see
   https://sandbox.jazzcash.com.pk/SandboxDocumentation/)
2. Confirm: order appears in `/admin/dashboard`, email arrives at your inbox, WhatsApp
   message arrives on your number (once WhatsApp is configured)
3. Change order status in the dashboard → confirm the customer's WhatsApp gets an update
4. Try `/track?order=YOUR-ORDER-NUMBER` to see the tracking timeline
5. Submit `/complaint` → confirm it lands in your Supabase `Complaint` table and pings
   your WhatsApp

## 9. Deploy to Vercel
1. Push this project to a GitHub repo
2. https://vercel.com → New Project → import the repo
3. Add every variable from `.env` into Vercel's Environment Variables settings
4. Set `NEXT_PUBLIC_BASE_URL` to your real Vercel domain (or custom domain) once known
   — JazzCash needs this to build the correct `pp_ReturnURL` for redirecting customers back
5. Deploy — then update the WhatsApp webhook URL to point at your live domain (step 5 above).
   JazzCash doesn't need a separate webhook registration step; it uses the `pp_ReturnURL`
   sent with each transaction automatically.

## What still needs real product content
- Replace the placeholder image blocks in `ProductCard.tsx` with your actual design photos
  (upload images to `/public/products/` or a storage bucket, and set real `imageUrl` values
  when adding products)
- Add a simple "Add Product" screen in the admin panel if you want to manage designs without
  touching the database directly (not built yet — happy to add this next)

## Notes on payments
Checkout is now in PKR via JazzCash's Hosted Checkout Page. The `pp_TxnType` field in
`src/lib/jazzcash.ts` is set to `MWALLET` (mobile wallet + card); confirm this matches what
your JazzCash sandbox/live account supports once you're testing — JazzCash sometimes assigns
specific transaction types per merchant. If you also want EasyPaisa as a second option, it
follows a very similar hosted-redirect pattern and can be added alongside this the same way.
