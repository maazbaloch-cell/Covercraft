ALTER TABLE "Order" ADD COLUMN "courier" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "courierLastSyncedAt" TIMESTAMP(3);
