# Production readiness report

## Build and architecture

`npm run build` succeeds and `npx tsc --noEmit` passes on the current codebase. The application uses the Next.js App Router, Prisma/Postgres, a server-side **EasyPaisa** Hosted Checkout handoff with email-OTP verification, customer accounts (bcrypt + JWT httpOnly cookies), Resend email, the Meta WhatsApp Cloud API, Supabase Storage, and configurable courier tracking adapters.

## Fixes applied

- Product data comes only from the database (no runtime auto-seeding or starter-catalog fallback).
- Checkout customer fields are validated and cart/custom-design payloads are bounded.
- All prices are recalculated on the server; standard-product stock reservation is transactional (compare-and-set) to prevent overselling during concurrent checkout.
- Allow-list validation on product updates and order-status changes closes the earlier mass-assignment path.
- Request throttling on checkout, OTP, and support submissions. The in-memory limiter is safe for a single instance; configure a shared limiter before horizontally scaling.
- Outbound network timeouts and bounded retries for WhatsApp delivery; notifications remain non-blocking after payment confirmation.
- Unavailable email/WhatsApp configuration is a safe no-op instead of a failed order flow.
- Cross-origin isolation headers in addition to anti-sniffing, frame, referrer and permissions headers.
- A protected, scheduled reservation-cleanup job (`/api/maintenance/release-reservations`, `CRON_SECRET`-gated) releases stock from abandoned checkouts.

## Security assessment

Addressed: input validation, checkout price tampering, inventory races, admin API mass assignment, HTML email escaping, webhook HMAC verification, protected admin cookies, outbound request timeouts, hashed/expiring checkout OTP codes (never returned in API responses), and basic abuse throttling.

Before launch: replace the in-memory throttler with Redis/Upstash, enforce a restrictive CSP after validating all required external resources, rotate any credentials that have ever been committed or shared, and configure hosting-level WAF/rate limiting and database backups.

## Provider readiness and manual tasks

- **EasyPaisa:** the code uses the Hosted Checkout HTTP POST flow and verifies the returned hash. EasyPaisa requires each merchant to generate a Store ID and hash key, confirm the enabled payment method, and complete sandbox transactions before go-live. Confirm the field set and the live endpoint in the merchant portal, then use production credentials. Do not claim live readiness without that test.
- **TCS/Leopards:** live tracking is an adapter because the exact merchant endpoint, authentication and payload schemas are account-specific. Obtain booking, tracking, webhook, label and signature documentation from the courier; configure those values server-side and complete sandbox/live tests. Admin shipment assignment and customer display are production-safe only after those credentials are configured.
- **Resend:** verify the sending domain and set `EMAIL_FROM` to that verified address. Customer checkout OTP, order confirmation, and shipping-update emails depend on this delivering reliably.
- **WhatsApp:** create approved Meta templates for business-initiated order messages when the 24-hour customer-service window does not apply; register the signed webhook and test delivery failures.
- **Supabase:** create the configured storage bucket, apply Prisma migrations to a properly baselined database, do not run the destructive seed in production, and assign least-privilege server credentials.

## Customer-facing features

Customer accounts (signup/login, profile, saved addresses, order history and self-service cancellation), the wishlist, and the two-step email-OTP checkout are implemented and type-check clean. These flows should still be exercised end-to-end against configured Resend/EasyPaisa credentials before launch.

## UI and performance status

The responsive storefront, custom-cover designer, cart, checkout, customer dashboard and order-tracking states compile successfully and are mobile-responsive (including a fix for designer-canvas overflow on narrow viewports). Next Image is used for catalogue imagery; the two custom-cover preview images use a plain `<img>` because they render fabric.js `toDataURL()` data URLs that Next Image cannot process — these are annotated with scoped lint-disable comments and do not produce warnings. No production performance measurement has been run against a deployed URL.

## Release decision

The source is build-ready and materially hardened, and the customer-account, OTP-checkout and EasyPaisa flows are implemented. It is **not truthful to call the entire application production-ready until the provider-specific merchant onboarding, credentials, webhooks, external integration tests, database migration and deployment security controls above are complete**. With those external prerequisites completed and the EasyPaisa/courier contracts validated, the supported flows can be deployed.
