-- Add email verification timestamp to customers
ALTER TABLE "Customer" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Drop the dead Stripe session column (payments run through EasyPaisa, never Stripe)
DROP INDEX IF EXISTS "Order_stripeSessionId_key";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "stripeSessionId";

-- One-time codes for email verification, password reset, and checkout confirmation
CREATE TABLE "VerificationCode" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationCode_email_purpose_idx" ON "VerificationCode"("email", "purpose");
