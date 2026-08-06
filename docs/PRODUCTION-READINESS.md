# Production readiness report

## Build and architecture

`npm.cmd run build` succeeds on the audited codebase. The application uses Next.js App Router, Prisma/Postgres, a server-side JazzCash hosted-payment handoff, Resend, Meta WhatsApp Cloud API, Supabase Storage, and configurable courier tracking adapters.

## Fixes applied

- Removed runtime catalogue auto-seeding and browser-visible starter-catalog fallback. Product data now comes only from the database.
- Added validated checkout customer fields and bounded cart/custom-design payloads.
- Recalculated all prices on the server and made standard-product stock reservation transactional to prevent overselling during concurrent checkout.
- Added allow-list validation for product updates and order-status changes, fixing the prior mass-assignment path.
- Added request throttling to checkout and support submissions. The in-memory limiter is safe for a single instance; configure a shared limiter before horizontally scaling.
- Added outbound network timeouts and bounded retries for WhatsApp delivery. Notifications remain non-blocking after payment confirmation.
- Made unavailable email and WhatsApp configuration a safe no-op instead of a failed order flow.
- Added missing `DIRECT_URL` and storage variables to `.env.example`.
- Added cross-origin isolation headers in addition to the existing anti-sniffing, frame, referrer and permissions headers.

## Security assessment

Addressed: input validation, checkout price tampering, inventory races, admin API mass assignment, HTML email escaping, webhook HMAC verification, protected admin cookies, outbound request timeouts, and basic abuse throttling.

Before launch: replace the in-memory throttler with Redis/Upstash, enforce a restrictive CSP after validating all required external resources, rotate any credentials that have ever been committed or shared, and configure hosting-level WAF/rate limiting and database backups.

## Provider readiness and manual tasks

- **JazzCash:** the code uses the Hosted Checkout v1.1 HTTP POST flow and verifies the returned secure hash. JazzCash requires each merchant to generate credentials, register the exact return URL, choose its approved payment mode, and complete sandbox transactions before go-live. Confirm the generated field set and secure-hash test vector in the merchant portal, then use the approved production endpoint/credentials. Do not claim live readiness without that test.
- **TCS/Leopards:** live tracking is an adapter because the exact merchant endpoint, authentication and payload schemas are account-specific. Obtain booking, tracking, webhook, label and signature documentation from the courier; configure those values server-side and complete sandbox/live tests. The current admin shipment assignment and customer display are production-safe only after those credentials are configured.
- **Resend:** verify the sending domain and set `EMAIL_FROM` to that verified address. OTP, customer authentication, password-reset, newsletter and shipping-email workflows are not implemented because this storefront has no customer account model; they must be specified and built before being advertised.
- **WhatsApp:** create approved Meta templates for business-initiated order messages when the 24-hour customer-service window does not apply; register the signed webhook and test delivery failures.
- **Supabase:** create the configured storage bucket, apply Prisma migrations to a properly baselined database, do not run the destructive seed in production, and assign least-privilege server credentials.

## UI and performance status

The responsive storefront, custom-cover designer, cart, checkout, dashboard and order-tracking states compile successfully. Next Image is used on product cards; two remaining `<img>` lint warnings are in internal cart/admin preview areas and do not block the production build. No production performance measurement has been run against a deployed URL.

## Release decision

The source is build-ready and materially hardened, but it is **not truthful to call the entire application production-ready until the provider-specific merchant onboarding, credentials, webhooks, external integration tests, database migration and deployment security controls above are complete**. With those external prerequisites completed and the merchant-specific JazzCash/courier contracts validated, the supported flows can be deployed.
