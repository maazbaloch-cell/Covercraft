# Setup custom designer

1. Install dependencies with `npm install` (Fabric.js is required).
2. Set `DATABASE_URL` and `DIRECT_URL` to your reachable Supabase Session Pooler URI on local IPv4 networks.
3. Run `npx prisma generate`, then `npx prisma db push` for this existing unbaselined database.
4. Run `npx prisma db seed` only for development sample data.
5. Start with `npm run dev` and visit `/customize-cover`.

## Storage

The current feature retains the canvas JSON and preview with the order record, so an order is manufacturable without third-party storage. For production-scale uploads, configure a private Supabase Storage bucket named `custom-designs` and add an upload API using a server-only Supabase service-role key. Never expose a service-role key through `NEXT_PUBLIC_*` variables.
