# Manual production configuration

## Required accounts

- **EasyPaisa Merchant:** obtain a production Store ID and AES hash key, confirm your enabled payment method (e.g. `MA_PAYMENT_METHOD` / `OTC_PAYMENT_METHOD`), and confirm the live Hosted Checkout endpoint for your merchant.
- **Meta WhatsApp Business:** create an app, verify the business/phone number, create approved notification templates, and obtain a permanent access token.
- **Resend:** create an API key and verify a sending domain (required for customer OTP and order emails to deliver reliably).
- **Vercel and domain:** connect the repository, configure the production domain and environment variables.
- **Supabase/Postgres and storage:** provision Postgres, a private upload bucket, backups, and least-privilege credentials.

## Required environment variables

Set these in Vercel (never commit them): `DATABASE_URL`, `DIRECT_URL`, `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_ENV`, `EASYPAISA_PAYMENT_METHOD`, `EASYPAISA_CHECKOUT_URL` (optional override), `RESEND_API_KEY`, `ADMIN_EMAIL`, `EMAIL_FROM`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `ADMIN_WHATSAPP_NUMBER`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `TCS_*`, `LEOPARDS_*`, and **`CRON_SECRET`** (required so the reservation-cleanup cron is authenticated).

Use a random `JWT_SECRET` of at least 32 characters. `ADMIN_INITIAL_PASSWORD` must be at least 12 characters (the seed enforces this). `NEXT_PUBLIC_BASE_URL` must be the HTTPS production domain, not localhost.

## Third-party configuration

- **EasyPaisa:** the store hands off to EasyPaisa's Hosted Checkout and verifies the returned hash on `POST /api/easypaisa/checkout` → EasyPaisa → `/api/easypaisa/callback`. Confirm your Store ID, hash key, enabled payment method, and the live endpoint in the merchant portal, and run sandbox transactions (success, decline, and duplicate-callback) before go-live. `NEXT_PUBLIC_BASE_URL` must be correct so the return URL resolves.
- **WhatsApp:** register Meta webhook `https://YOUR_DOMAIN/api/whatsapp/webhook`, set the verify token, configure `WHATSAPP_APP_SECRET`, subscribe to message and delivery-status events, and use approved business templates for business-initiated messages.
- **Resend:** verify the sending domain and required DNS records before sending customer email. This is required for checkout OTP codes and order confirmations to reach customers.
- **Prisma:** apply migrations with `npx prisma migrate deploy`; do not run the destructive seed in production (run it once to create the admin, then rotate the password).
- **Storage:** configure the Supabase bucket and policy before enabling admin product-image uploads.

## Scheduled job (reservation cleanup)

- The store reserves standard-product stock at checkout and releases it if payment never completes. `vercel.json` schedules `GET /api/maintenance/release-reservations` every 15 minutes.
- The endpoint rejects any request without `Authorization: Bearer $CRON_SECRET`. Vercel Cron includes this header automatically when `CRON_SECRET` is set in the environment.
- **Plan caveat:** Vercel's **Hobby (free)** plan runs cron jobs at most **once per day**; the 15-minute schedule requires the **Pro** plan. On Hobby, change the schedule to daily or trigger the endpoint from an external scheduler using the same Bearer secret.

## Deployment checklist

1. Rotate any previously shared secrets and add the production environment variables (including `CRON_SECRET`).
2. Run `npx prisma migrate deploy`, `npx prisma generate`, and `npm run build` against a fresh staging database.
3. Run an EasyPaisa sandbox purchase, callback failure, expiry (abandoned payment), and duplicate-callback test; confirm reserved stock is released on the failure/expiry paths.
4. Verify checkout email OTP delivery, order email, WhatsApp delivery webhooks, storage upload, admin login/logout, customer signup/login, and courier tracking.
5. Run browser smoke tests on the Vercel preview, then production.

## Manual security checklist

Enable HTTPS, a restrictive CSP after validating provider domains, Vercel/WAF rate limits, database backups and restore drills, centralized error monitoring, log retention/redaction, and confirm the authenticated reservation-cleanup schedule is deployed with a strong `CRON_SECRET`.
