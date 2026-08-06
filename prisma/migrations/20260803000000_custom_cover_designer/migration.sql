-- Apply this migration only after baselining the existing database. See docs/DATABASE_CHANGES.md.
CREATE TYPE "ProductType" AS ENUM ('STANDARD', 'CUSTOMIZED_COVER');

CREATE TABLE "MobileModel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileModel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MobileModel_name_key" ON "MobileModel"("name");

CREATE TABLE "CoverTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT,
  "price" INTEGER NOT NULL DEFAULT 199900,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "mobileModelId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoverTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomDesign" (
  "id" TEXT NOT NULL,
  "mobileModel" TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "designJson" TEXT NOT NULL,
  "previewImage" TEXT NOT NULL,
  "coverColor" TEXT NOT NULL DEFAULT 'White',
  "colorHex" TEXT NOT NULL DEFAULT '#ffffff',
  "selectedColorName" TEXT NOT NULL DEFAULT 'White',
  "textDetails" JSONB,
  "uploadedAssets" JSONB,
  "templateId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomDesign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD COLUMN "customDesignId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "CoverTemplate" ADD CONSTRAINT "CoverTemplate_mobileModelId_fkey" FOREIGN KEY ("mobileModelId") REFERENCES "MobileModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomDesign" ADD CONSTRAINT "CustomDesign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CoverTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_customDesignId_fkey" FOREIGN KEY ("customDesignId") REFERENCES "CustomDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
