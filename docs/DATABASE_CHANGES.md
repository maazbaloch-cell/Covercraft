# Database changes

The feature adds `MobileModel`, `CoverTemplate`, and `CustomDesign` and allows an `OrderItem` to reference either a normal `Product` or a `CustomDesign`.

This project already has an existing Supabase schema without Prisma migration history. For that database, run:

```bash
npx prisma db push
npx prisma db seed
```

The SQL under `prisma/migrations/20260803000000_custom_cover_designer` is supplied for a properly baselined production database. Do not run `prisma migrate deploy` against the current database until you have baselined its existing schema; Prisma otherwise returns P3005.

The seed command clears existing orders/products, so never run it against live customer data.
