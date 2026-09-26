import { prisma } from './prisma.js';

// Al arrancar, crea en la base lo que falte para esta versión (programa de afiliados e imágenes).
// Producción se actualiza con cada push y la base no, así que el servidor se encarga.
//
// REGLAS: solo sentencias que AGREGAN y con "si no existe". Nunca DROP, DELETE, TRUNCATE ni cambios
// de tipo en columnas existentes. Correrlo muchas veces no cambia nada después de la primera.
// Cada sentencia va sola (sin transacción): ALTER TYPE ... ADD VALUE no puede ir dentro de una.

const addForeignKey = (name: string, table: string, sql: string) => `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
    ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${sql};
  END IF;
END $$;`;

const createEnum = (name: string, values: string[]) => `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
    CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')});
  END IF;
END $$;`;

const STATEMENTS: string[] = [
  // Tipos
  createEnum('AffiliateStatus', ['pending', 'active', 'suspended']),
  createEnum('AffiliateCommissionStatus', ['pending', 'approved', 'paid', 'cancelled', 'reversed']),
  `ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'adjustment'`,
  `ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'refund'`,
  `ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'affiliate_commission'`,
  `ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'affiliate_reversal'`,

  // Columnas nuevas en tablas existentes (opcionales o con valor por defecto)
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "affiliateAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkoutGroup" TEXT`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateBlocked" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateEnabled" BOOLEAN`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateRate" DOUBLE PRECISION`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
  `ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "affiliateAllProducts" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "affiliateBlocked" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "affiliateDefaultRate" DOUBLE PRECISION`,
  `ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "affiliateEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT`,

  // Tablas nuevas
  `CREATE TABLE IF NOT EXISTS "affiliate_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'active',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "affiliate_profiles_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "affiliate_links" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
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
  )`,
  `CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
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
  )`,

  `CREATE TABLE IF NOT EXISTS "media_files" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
  )`,

  // Índices
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_profiles_userId_key" ON "affiliate_profiles"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_profiles_code_key" ON "affiliate_profiles"("code")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_links_sellerId_idx" ON "affiliate_links"("sellerId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_links_affiliateId_sellerId_productId_key" ON "affiliate_links"("affiliateId", "sellerId", "productId")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_clicks_visitorId_createdAt_idx" ON "affiliate_clicks"("visitorId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_clicks_userId_createdAt_idx" ON "affiliate_clicks"("userId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_clicks_affiliateId_createdAt_idx" ON "affiliate_clicks"("affiliateId", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissions_orderItemId_key" ON "affiliate_commissions"("orderItemId")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliateId_status_idx" ON "affiliate_commissions"("affiliateId", "status")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_commissions_sellerId_idx" ON "affiliate_commissions"("sellerId")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_commissions_status_availableAt_idx" ON "affiliate_commissions"("status", "availableAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_key" ON "products"("slug")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId")`,

  // Relaciones
  addForeignKey('affiliate_profiles_userId_fkey', 'affiliate_profiles', `FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  addForeignKey('affiliate_links_affiliateId_fkey', 'affiliate_links', `FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  addForeignKey('affiliate_clicks_affiliateId_fkey', 'affiliate_clicks', `FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  addForeignKey('affiliate_clicks_linkId_fkey', 'affiliate_clicks', `FOREIGN KEY ("linkId") REFERENCES "affiliate_links"("id") ON DELETE SET NULL ON UPDATE CASCADE`),
  addForeignKey('affiliate_commissions_affiliateId_fkey', 'affiliate_commissions', `FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  addForeignKey('affiliate_commissions_orderId_fkey', 'affiliate_commissions', `FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  addForeignKey('affiliate_commissions_buyerId_fkey', 'affiliate_commissions', `FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
];

// Red de seguridad: si alguien agrega acá una sentencia destructiva, no se ejecuta.
const FORBIDDEN = /\b(DROP|DELETE|TRUNCATE|RENAME|ALTER\s+COLUMN)\b/i;

export const ensureSchema = async () => {
  let failed = 0;
  for (const sql of STATEMENTS) {
    // "ON DELETE CASCADE/RESTRICT" en una relación nueva no borra nada: se ignora al revisar
    if (FORBIDDEN.test(sql.replace(/ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL)/gi, ''))) {
      console.error('[esquema] sentencia destructiva bloqueada:', sql.slice(0, 80));
      failed++;
      continue;
    }
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e: any) {
      failed++;
      console.error('[esquema] no se pudo aplicar:', sql.trim().split('\n')[0].slice(0, 100), '→', e?.message?.split('\n').pop());
    }
  }
  if (failed) console.error(`[esquema] ${failed} sentencia(s) fallaron; revisar el log de arriba`);
  else console.log('🗄️  Esquema verificado (afiliados, imágenes)');
  return { total: STATEMENTS.length, failed };
};
