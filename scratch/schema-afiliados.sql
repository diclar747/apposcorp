-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('pending', 'approved', 'paid', 'cancelled', 'reversed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'adjustment';
ALTER TYPE "TransactionType" ADD VALUE 'refund';
ALTER TYPE "TransactionType" ADD VALUE 'affiliate_commission';
ALTER TYPE "TransactionType" ADD VALUE 'affiliate_reversal';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "affiliateAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "checkoutGroup" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "affiliateBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "affiliateEnabled" BOOLEAN,
ADD COLUMN     "affiliateRate" DOUBLE PRECISION,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "affiliateAllProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "affiliateBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "affiliateDefaultRate" DOUBLE PRECISION,
ADD COLUMN     "affiliateEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "googleId" TEXT;

-- CreateTable
CREATE TABLE "affiliate_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'active',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "linkId" TEXT,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_commissions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "clickId" TEXT,
    "source" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "AffiliateCommissionStatus" NOT NULL DEFAULT 'pending',
    "funded" BOOLEAN NOT NULL DEFAULT false,
    "availableAt" TIMESTAMP(3),
    "walletTxId" TEXT,
    "note" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_profiles_userId_key" ON "affiliate_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_profiles_code_key" ON "affiliate_profiles"("code");

-- CreateIndex
CREATE INDEX "affiliate_links_sellerId_idx" ON "affiliate_links"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_links_affiliateId_sellerId_productId_key" ON "affiliate_links"("affiliateId", "sellerId", "productId");

-- CreateIndex
CREATE INDEX "affiliate_clicks_visitorId_createdAt_idx" ON "affiliate_clicks"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_clicks_userId_createdAt_idx" ON "affiliate_clicks"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_clicks_affiliateId_createdAt_idx" ON "affiliate_clicks"("affiliateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_commissions_orderItemId_key" ON "affiliate_commissions"("orderItemId");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliateId_status_idx" ON "affiliate_commissions"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "affiliate_commissions_sellerId_idx" ON "affiliate_commissions"("sellerId");

-- CreateIndex
CREATE INDEX "affiliate_commissions_status_availableAt_idx" ON "affiliate_commissions"("status", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- AddForeignKey
ALTER TABLE "affiliate_profiles" ADD CONSTRAINT "affiliate_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

