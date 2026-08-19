import { PrismaClient } from "@prisma/client";

/**
 * seedPhones — additive, idempotent catalog of ~50 real phone models.
 *
 * SAFE TO RUN ON PRODUCTION. Unlike prisma/seed.ts (which deleteMany()s every
 * table and must NEVER touch prod), this script ONLY:
 *   1. upserts each model by its unique `name` — the update clause is an empty
 *      no-op, so an existing row is a pure existence check and is never modified
 *      (an admin-deactivated or renamed-brand model is left exactly as-is), and
 *   2. for a model that has ZERO cover templates, creates the three standard
 *      templates so it appears in the custom-cover catalog (which only returns
 *      models that have at least one active template).
 * It never deletes anything and never touches products, orders, admins, or any
 * template that already exists. Re-running it is a no-op — no duplicate models,
 * no duplicate templates.
 *
 * Requires DATABASE_URL. Unlike seed.ts it needs no admin env vars.
 * Run with:  npm run seed:phones
 */

const prisma = new PrismaClient();

// The three standard templates a model needs to show up in the catalog. Mirrors
// prisma/seed.ts so the existing 16 models and the new ones look identical.
const STANDARD_TEMPLATES = [
  { name: "Clear Matte", price: 199900 },
  { name: "Soft Touch", price: 219900 },
  { name: "Armor Protection", price: 249900 },
] as const;

// ~50 curated real models grouped by brand. The 16 from the original seed are a
// subset, so upsert makes those existence checks (no-ops). Names here MUST match
// the keys in src/lib/phoneShapes.ts so each model resolves to its drawn shape.
const MODELS: [string, string][] = [
  // Apple
  ["Apple", "iPhone 16 Pro Max"], ["Apple", "iPhone 16 Pro"], ["Apple", "iPhone 16 Plus"], ["Apple", "iPhone 16"],
  ["Apple", "iPhone 15 Pro Max"], ["Apple", "iPhone 15 Pro"], ["Apple", "iPhone 15"],
  ["Apple", "iPhone 14 Pro Max"], ["Apple", "iPhone 14"],
  // Samsung
  ["Samsung", "Galaxy S24 Ultra"], ["Samsung", "Galaxy S24+"], ["Samsung", "Galaxy S24"],
  ["Samsung", "Galaxy S23 Ultra"], ["Samsung", "Galaxy S23"],
  ["Samsung", "Galaxy Z Fold 6"], ["Samsung", "Galaxy Z Flip 6"], ["Samsung", "Galaxy A55"], ["Samsung", "Galaxy A35"],
  // Google
  ["Google", "Pixel 9 Pro XL"], ["Google", "Pixel 9 Pro"], ["Google", "Pixel 9"],
  ["Google", "Pixel 8 Pro"], ["Google", "Pixel 8"], ["Google", "Pixel 8a"],
  // Xiaomi / Redmi / Poco
  ["Xiaomi", "Xiaomi 14 Ultra"], ["Xiaomi", "Xiaomi 14"], ["Xiaomi", "Redmi Note 13 Pro"], ["Xiaomi", "Redmi Note 13"], ["Xiaomi", "Poco X6 Pro"],
  // OnePlus
  ["OnePlus", "OnePlus 12"], ["OnePlus", "OnePlus 12R"], ["OnePlus", "Nord 4"],
  // Oppo / Vivo / Realme
  ["Oppo", "Reno 12 Pro"], ["Oppo", "Reno 11"], ["Vivo", "X100 Pro"], ["Vivo", "V30"], ["Realme", "GT 6"], ["Realme", "12 Pro+"],
  // Motorola / Nothing
  ["Motorola", "Edge 50 Pro"], ["Motorola", "Moto G84"], ["Nothing", "Phone (2)"], ["Nothing", "Phone (2a)"],
  // Huawei / Tecno / Infinix
  ["Huawei", "Mate 60 Pro"], ["Huawei", "P60 Pro"], ["Tecno", "Camon 30"], ["Tecno", "Spark 20"], ["Infinix", "Note 40"], ["Infinix", "Hot 40"],
];

async function main() {
  console.log(`🌱 Ensuring ${MODELS.length} phone models (additive, non-destructive)...`);
  let newModels = 0;
  let templatedModels = 0;

  for (const [brand, name] of MODELS) {
    const existing = await prisma.mobileModel.findUnique({ where: { name }, select: { id: true } });
    const model = await prisma.mobileModel.upsert({
      where: { name },
      update: {}, // never modify an existing row
      create: { brand, name },
    });
    if (!existing) newModels++;

    // Only give templates to a model that has none — never duplicate existing ones.
    const templateCount = await prisma.coverTemplate.count({ where: { mobileModelId: model.id } });
    if (templateCount === 0) {
      await prisma.coverTemplate.createMany({
        data: STANDARD_TEMPLATES.map((t) => ({ name: t.name, price: t.price, mobileModelId: model.id })),
      });
      templatedModels++;
    }
  }

  console.log(`✅ Done. New models added: ${newModels}. Models given standard templates: ${templatedModels}. Total curated: ${MODELS.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
