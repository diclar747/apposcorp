ALTER TABLE "ingenio_subscriptions" ADD COLUMN IF NOT EXISTS "receipts" JSONB DEFAULT '[]';
