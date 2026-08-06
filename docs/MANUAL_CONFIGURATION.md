# Manual production configuration

## Required accounts

- **JazzCash Merchant:** obtain production merchant ID, password, integrity salt, approved transaction type, and registered callback URL.
- **Meta WhatsApp Business:** create an app, verify the business/phone number, create approved notification templates, and obtain a permanent access token.
- **Resend:** create an API key and verify a sending domain.
- **Vercel and domain:** connect the repository, configure the production domain and environment variables.
- **Supabase/Postgres and storage:** provision Postgres, a private upload bucket, backups, and least-privilege credentials.

## Required environment variables

Set these in Vercel (never commit them): `DATABASE_URL`, `DIRECT_URL`, `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_ENV`, `RESEND_API_KEY`, `ADMIN_EMAIL`, `EMAIL_FROM`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `ADMIN_WHATSAPP_NUMBER`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `TCS_*`, `LEOPARDS_*`, and a protected `CRON_SECRET` when reservation cleanup is scheduled.

Use a random JWT secret of at least 32 characters. `NEXT_PUBLIC_BASE_URL` must be the HTTPS production domain, not localhost.

## Third-party configuration

- Register `https://YOUR_DOMAIN/api/jazzcash/callback` with JazzCash and run merchant-provided sandbox/live verification vectors.
- Register Meta webhook `https://YOUR_DOMAIN/api/whatsapp/webhook`, set the verify token, configure `WHATSAPP_APP_SECRET`, subscribe to message and delivery-status events, and use approved business templates.
- Verify the Resend sending domain and required DNS records before sending customer email.
- Apply Prisma migrations with `npx prisma migrate deploy`; do not run the destructive seed in production.
- Configure the storage bucket and policy before enabling admin uploads.

## Deployment checklist

1. Rotate any previously shared secrets and add the production environment variables.
2. Run `npx prisma migrate deploy`, `npx prisma generate`, and `npm run build` against a fresh staging database.
3. Run a JazzCash sandbox purchase, callback failure, expiry, and duplicate-callback test.
4. Verify email, WhatsApp delivery webhooks, storage upload, admin login/logout, and courier tracking.
5. Run browser smoke tests on the Vercel preview, then production.

## Manual security checklist

Enable HTTPS, a restrictive CSP after validating provider domains, Vercel/WAF rate limits, database backups and restore drills, centralized error monitoring, log retention/redaction, and an authenticated scheduled job for expired inventory reservations.
