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
  // Cursos de Ingenio Millonario en el mismo motor de afiliados (solo columnas nuevas)
  // Aparte, a mano y con respaldo: database/afiliados_cursos.sql (vuelve opcional orderId/orderItemId)
  `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "affiliateEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "affiliateRate" DOUBLE PRECISION`,
  // Encargados de tiendas
  `ALTER TABLE "affiliate_commissions" ADD COLUMN IF NOT EXISTS "refKey" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissions_refKey_key" ON "affiliate_commissions"("refKey")`,
  `CREATE TABLE IF NOT EXISTS "store_managers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "maxStores" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "store_managers_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "store_managers_userId_key" ON "store_managers"("userId")`,
  `CREATE TABLE IF NOT EXISTS "store_manager_assignments" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_manager_assignments_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "store_manager_assignments_sellerId_key" ON "store_manager_assignments"("sellerId")`,
  `CREATE INDEX IF NOT EXISTS "store_manager_assignments_managerId_idx" ON "store_manager_assignments"("managerId")`,
  addForeignKey('store_manager_assignments_managerId_fkey', 'store_manager_assignments', `FOREIGN KEY ("managerId") REFERENCES "store_managers"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tutorEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tutorRate" DOUBLE PRECISION`,
  `CREATE TABLE IF NOT EXISTS "course_tutors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "course_tutors_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "course_tutors_userId_courseId_key" ON "course_tutors"("userId", "courseId")`,
  `CREATE INDEX IF NOT EXISTS "course_tutors_courseId_status_idx" ON "course_tutors"("courseId", "status")`,
  `CREATE TABLE IF NOT EXISTS "affiliate_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_audit_logs_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "affiliate_audit_logs_createdAt_idx" ON "affiliate_audit_logs"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "affiliate_audit_logs_entity_entityId_idx" ON "affiliate_audit_logs"("entity", "entityId")`,
  `ALTER TABLE "affiliate_clicks" ADD COLUMN IF NOT EXISTS "courseId" TEXT`,
  `ALTER TABLE "affiliate_commissions" ADD COLUMN IF NOT EXISTS "courseId" TEXT`,
  `ALTER TABLE "affiliate_commissions" ADD COLUMN IF NOT EXISTS "userCourseId" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissions_userCourseId_key" ON "affiliate_commissions"("userCourseId")`,
  // Comentarios moderados y visitas de tiendas
  `CREATE TABLE IF NOT EXISTS "product_comments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_comments_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "product_comments_productId_status_idx" ON "product_comments"("productId", "status")`,
  `CREATE INDEX IF NOT EXISTS "product_comments_status_createdAt_idx" ON "product_comments"("status", "createdAt")`,
  addForeignKey('product_comments_productId_fkey', 'product_comments', `FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  `CREATE TABLE IF NOT EXISTS "store_visits" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_visits_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "store_visits_sellerId_visitorId_day_key" ON "store_visits"("sellerId", "visitorId", "day")`,
  `CREATE INDEX IF NOT EXISTS "store_visits_sellerId_day_idx" ON "store_visits"("sellerId", "day")`,
  // Ofertas y favoritos
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offerEndsAt" TIMESTAMP(3)`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offerBlocked" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offerAlertSent" BOOLEAN NOT NULL DEFAULT false`,
  `CREATE TABLE IF NOT EXISTS "product_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_favorites_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "product_favorites_userId_productId_key" ON "product_favorites"("userId", "productId")`,
  `CREATE INDEX IF NOT EXISTS "product_favorites_productId_idx" ON "product_favorites"("productId")`,
  addForeignKey('product_favorites_productId_fkey', 'product_favorites', `FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  // Remates
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionStatus" TEXT`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionEndsAt" TIMESTAMP(3)`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionStartPrice" DOUBLE PRECISION`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionMinIncrement" DOUBLE PRECISION`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionWinnerId" TEXT`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "auctionPayBy" TIMESTAMP(3)`,
  `CREATE TABLE IF NOT EXISTS "auction_bids" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "auction_bids_productId_amount_idx" ON "auction_bids"("productId", "amount")`,
  `CREATE INDEX IF NOT EXISTS "auction_bids_userId_idx" ON "auction_bids"("userId")`,
  addForeignKey('auction_bids_productId_fkey', 'auction_bids', `FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateBlocked" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateEnabled" BOOLEAN`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "affiliateRate" DOUBLE PRECISION`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
  // Entrega de productos (rediseño de tienda)
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deliveryMode" TEXT NOT NULL DEFAULT 'arrange'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0`,
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
