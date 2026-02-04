-- ============================================
-- OSCORP PLATFORM - DATABASE SCHEMA
-- PostgreSQL (Neon)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('client', 'seller', 'superadmin');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled', 'refunded');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "PaymentMethod" AS ENUM ('wallet', 'cash', 'card', 'transfer');
CREATE TYPE "ProductType" AS ENUM ('physical', 'service', 'digital');
CREATE TYPE "ProductVisibility" AS ENUM ('online', 'local', 'both');
CREATE TYPE "CourseLevel" AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE "CreditStatus" AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'defaulted');
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense', 'transfer_in', 'transfer_out', 'purchase', 'sale', 'withdrawal', 'deposit', 'commission', 'credit', 'fee');
CREATE TYPE "FinancialType" AS ENUM ('income', 'expense', 'asset', 'liability');
CREATE TYPE "CardDesign" AS ENUM ('gradient_blue', 'gradient_purple', 'gradient_dark', 'minimal');

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "avatar" TEXT,
    "role" "UserRole" DEFAULT 'client',
    "isActive" BOOLEAN DEFAULT true,
    "ingenioAccess" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "bank_data" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "bankName" VARCHAR(255) NOT NULL,
    "accountNumber" VARCHAR(100) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL,
    "holderName" VARCHAR(255) NOT NULL,
    "documentId" VARCHAR(100) NOT NULL
);

-- ============================================
-- SELLER & STORE
-- ============================================
CREATE TABLE "seller_profiles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "storeName" VARCHAR(255) NOT NULL,
    "storeSlug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "whatsappNumber" VARCHAR(50) NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "planActive" BOOLEAN DEFAULT false,
    "planExpiryDate" TIMESTAMP,
    "commissionRate" FLOAT DEFAULT 5.0,
    "totalSales" INTEGER DEFAULT 0,
    "totalRevenue" FLOAT DEFAULT 0,
    "rating" FLOAT DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "businessHours" JSONB,
    "socialLinks" JSONB
);

CREATE TABLE "stores" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sellerId" UUID UNIQUE NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "whatsappNumber" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "isOnline" BOOLEAN DEFAULT true,
    "businessHours" JSONB,
    "socialLinks" JSONB
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE "products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sellerId" UUID NOT NULL REFERENCES "seller_profiles"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" FLOAT NOT NULL,
    "comparePrice" FLOAT,
    "stock" INTEGER DEFAULT 0,
    "sku" VARCHAR(100) UNIQUE NOT NULL,
    "images" TEXT[] DEFAULT '{}',
    "category" VARCHAR(100) NOT NULL,
    "subcategory" VARCHAR(100),
    "type" "ProductType" DEFAULT 'physical',
    "visibility" "ProductVisibility" DEFAULT 'both',
    "status" VARCHAR(50) DEFAULT 'active',
    "weight" FLOAT,
    "dimensions" JSONB,
    "tags" TEXT[] DEFAULT '{}',
    "isFeatured" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "product_variants" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "price" FLOAT NOT NULL,
    "stock" INTEGER DEFAULT 0,
    "sku" VARCHAR(100) NOT NULL
);

CREATE TABLE "product_attributes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "value" VARCHAR(255) NOT NULL
);

-- ============================================
-- WALLET & VIRTUAL CARD
-- ============================================
CREATE TABLE "wallets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "balance" FLOAT DEFAULT 0,
    "currency" VARCHAR(10) DEFAULT 'USD',
    "status" VARCHAR(50) DEFAULT 'active',
    "dailyLimit" FLOAT DEFAULT 1000,
    "monthlyLimit" FLOAT DEFAULT 10000,
    "totalIn" FLOAT DEFAULT 0,
    "totalOut" FLOAT DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "virtual_cards" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "walletId" UUID UNIQUE NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
    "cardNumber" VARCHAR(50) UNIQUE NOT NULL,
    "qrCode" TEXT,
    "qrData" TEXT,
    "design" "CardDesign" DEFAULT 'gradient_blue',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE "transactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "walletId" UUID NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" "TransactionType" NOT NULL,
    "amount" FLOAT NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "category" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'completed',
    "relatedUserId" UUID,
    "relatedOrderId" UUID,
    "relatedCreditId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE "orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderNumber" VARCHAR(100) UNIQUE NOT NULL,
    "buyerId" UUID NOT NULL REFERENCES "users"("id"),
    "sellerId" UUID NOT NULL REFERENCES "users"("id"),
    "subtotal" FLOAT NOT NULL,
    "tax" FLOAT DEFAULT 0,
    "shippingCost" FLOAT DEFAULT 0,
    "discount" FLOAT DEFAULT 0,
    "total" FLOAT NOT NULL,
    "status" "OrderStatus" DEFAULT 'pending',
    "paymentStatus" "PaymentStatus" DEFAULT 'pending',
    "paymentMethod" "PaymentMethod" DEFAULT 'wallet',
    "deliveryType" VARCHAR(50) NOT NULL,
    "deliveryAddress" JSONB,
    "deliveryNotes" TEXT,
    "estimatedDelivery" TIMESTAMP,
    "actualDelivery" TIMESTAMP,
    "commissionAmount" FLOAT DEFAULT 0,
    "sellerEarnings" FLOAT DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "order_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "products"("id"),
    "productName" VARCHAR(255) NOT NULL,
    "productImage" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" FLOAT NOT NULL,
    "total" FLOAT NOT NULL,
    "variant" VARCHAR(255)
);

CREATE TABLE "tracking_events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "status" "OrderStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "location" VARCHAR(255)
);

-- ============================================
-- COURSES
-- ============================================
CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "coverImage" TEXT,
    "previewVideo" TEXT,
    "instructorId" VARCHAR(255) NOT NULL,
    "instructorName" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "level" "CourseLevel" DEFAULT 'beginner',
    "price" FLOAT DEFAULT 0,
    "comparePrice" FLOAT,
    "duration" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT false,
    "isFeatured" BOOLEAN DEFAULT false,
    "enrolledCount" INTEGER DEFAULT 0,
    "rating" FLOAT DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "modules" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "courseId" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

CREATE TABLE "lessons" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "moduleId" UUID NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT,
    "duration" INTEGER DEFAULT 0,
    "order" INTEGER NOT NULL,
    "isPreview" BOOLEAN DEFAULT false
);

CREATE TABLE "resources" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "courseId" UUID REFERENCES "courses"("id") ON DELETE CASCADE,
    "lessonId" UUID REFERENCES "lessons"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL
);

CREATE TABLE "enrollments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "courseId" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
    "progress" FLOAT DEFAULT 0,
    "completedModules" TEXT[] DEFAULT '{}',
    "completedLessons" TEXT[] DEFAULT '{}',
    "totalTimeSpent" INTEGER DEFAULT 0,
    "lastAccessedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    "certificateIssued" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "courseId")
);

-- ============================================
-- CREDITS
-- ============================================
CREATE TABLE "credits" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "amount" FLOAT NOT NULL,
    "concept" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "installmentAmount" FLOAT NOT NULL,
    "totalToPay" FLOAT NOT NULL,
    "interestRate" FLOAT DEFAULT 0,
    "status" "CreditStatus" DEFAULT 'pending',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "credit_documents" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "creditId" UUID NOT NULL REFERENCES "credits"("id") ON DELETE CASCADE,
    "type" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "payment_schedule_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "creditId" UUID NOT NULL REFERENCES "credits"("id") ON DELETE CASCADE,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP NOT NULL,
    "amount" FLOAT NOT NULL,
    "principal" FLOAT NOT NULL,
    "interest" FLOAT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "paidAt" TIMESTAMP
);

CREATE TABLE "credit_payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "creditId" UUID NOT NULL REFERENCES "credits"("id") ON DELETE CASCADE,
    "installmentId" UUID NOT NULL REFERENCES "payment_schedule_items"("id") ON DELETE CASCADE,
    "amount" FLOAT NOT NULL,
    "paidAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" VARCHAR(50) NOT NULL
);

-- ============================================
-- FINANCES (INGENIO MILLONARIO)
-- ============================================
CREATE TABLE "financial_categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "type" "FinancialType" NOT NULL,
    "color" VARCHAR(50) DEFAULT '#3B82F6',
    "icon" VARCHAR(100) DEFAULT 'wallet',
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "financial_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "categoryId" UUID NOT NULL REFERENCES "financial_categories"("id") ON DELETE CASCADE,
    "type" "FinancialType" NOT NULL,
    "amount" FLOAT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "isRecurring" BOOLEAN DEFAULT false,
    "recurrencePattern" VARCHAR(100),
    "attachments" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "budgets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "incomeGoal" FLOAT DEFAULT 0,
    "expenseLimit" FLOAT DEFAULT 0,
    "categoryLimits" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "month", "year")
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'info',
    "isRead" BOOLEAN DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CART
-- ============================================
CREATE TABLE "cart_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "quantity" INTEGER DEFAULT 1,
    UNIQUE("userId", "productId")
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON "users"("email");
CREATE INDEX idx_users_role ON "users"("role");
CREATE INDEX idx_products_seller ON "products"("sellerId");
CREATE INDEX idx_products_category ON "products"("category");
CREATE INDEX idx_products_status ON "products"("status");
CREATE INDEX idx_orders_buyer ON "orders"("buyerId");
CREATE INDEX idx_orders_seller ON "orders"("sellerId");
CREATE INDEX idx_orders_status ON "orders"("status");
CREATE INDEX idx_transactions_user ON "transactions"("userId");
CREATE INDEX idx_transactions_wallet ON "transactions"("walletId");
CREATE INDEX idx_courses_slug ON "courses"("slug");
CREATE INDEX idx_courses_category ON "courses"("category");
CREATE INDEX idx_enrollments_user ON "enrollments"("userId");
CREATE INDEX idx_enrollments_course ON "enrollments"("courseId");
CREATE INDEX idx_credits_user ON "credits"("userId");
CREATE INDEX idx_notifications_user ON "notifications"("userId");
CREATE INDEX idx_notifications_read ON "notifications"("isRead");

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "products" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON "wallets" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON "courses" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON "credits" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
