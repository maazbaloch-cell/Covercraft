CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

CREATE TABLE "Admin" ("id" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Admin_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE TABLE "Product" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "imageUrl" TEXT NOT NULL, "price" INTEGER NOT NULL, "category" TEXT, "brand" TEXT, "model" TEXT, "stock" INTEGER NOT NULL DEFAULT 0, "isAvailable" BOOLEAN NOT NULL DEFAULT true, "isActive" BOOLEAN NOT NULL DEFAULT true, "deletedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Product_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Order" ("id" TEXT NOT NULL, "orderNumber" TEXT NOT NULL, "customerName" TEXT NOT NULL, "customerEmail" TEXT NOT NULL, "customerPhone" TEXT NOT NULL, "shippingAddress" TEXT NOT NULL, "city" TEXT NOT NULL, "deliveryLocation" TEXT, "totalAmount" INTEGER NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING', "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID', "stripeSessionId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Order_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
CREATE TABLE "OrderItem" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "price" INTEGER NOT NULL, CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TrackingEvent" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "status" "OrderStatus" NOT NULL, "note" TEXT, "location" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Payment" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "method" TEXT, "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID', "transactionId" TEXT, "amount" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE TABLE "Complaint" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "orderNumber" TEXT, "message" TEXT NOT NULL, "channel" TEXT NOT NULL DEFAULT 'whatsapp', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id"));
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
