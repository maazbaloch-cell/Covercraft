import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sampleProducts } from "../src/data/products";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean old data
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.customDesign.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.coverTemplate.deleteMany();
  await prisma.mobileModel.deleteMany();

  // Add products
  for (const product of sampleProducts) {
    await prisma.product.create({
      data: {
        ...product,
        isActive: true,
      },
    });
  }

  const models = await Promise.all([
    ["Apple", "iPhone 15"], ["Apple", "iPhone 15 Pro Max"],
    ["Samsung", "Galaxy S24"], ["Samsung", "Galaxy S24 Ultra"], ["Samsung", "Galaxy A55"],
    ["Google", "Pixel 8"], ["Google", "Pixel 8 Pro"],
    ["Xiaomi", "Redmi Note 13"], ["Xiaomi", "Xiaomi 14"], ["OnePlus", "OnePlus 12"],
    ["Oppo", "Reno 11"], ["Vivo", "V30"], ["Realme", "12 Pro+"],
    ["Huawei", "P60 Pro"], ["Tecno", "Camon 30"], ["Infinix", "Note 40"],
  ].map(([brand, name]) => prisma.mobileModel.create({ data: { brand, name } })));
  await prisma.coverTemplate.createMany({ data: models.flatMap((model) => [
    { name: "Clear Matte", price: 199900, mobileModelId: model.id },
    { name: "Soft Touch", price: 219900, mobileModelId: model.id },
    { name: "Armor Protection", price: 249900, mobileModelId: model.id },
  ]) });

  // Add admin. Seeding must never create a publicly known default credential.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_INITIAL_PASSWORD of at least 12 characters before running the seed.");
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log("✅ Seed complete");
  console.log(`Admin created for ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
