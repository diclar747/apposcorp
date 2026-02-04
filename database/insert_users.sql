-- ============================================
-- INSERT USUÁRIOS E DADOS RELACIONADOS
-- Execute no console do Neon ou psql
-- ============================================

-- ============================================
-- 1. USUÁRIOS (senha: 123456)
-- A senha está hasheada com bcrypt
-- ============================================
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive", "ingenioAccess") VALUES 
('a0000000-0000-0000-0000-000000000001', 'admin@oscorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Oscorp', '+1 234 567 8900', '123 Admin Street', 'New York', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'superadmin', true, true),
('b0000000-0000-0000-0000-000000000001', 'seller1@oscorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'Vendedor', '+1 234 567 8901', '456 Seller Ave', 'Los Angeles', 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1', 'seller', true, false),
('b0000000-0000-0000-0000-000000000002', 'seller2@oscorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria', 'Loja', '+1 234 567 8902', '789 Market St', 'Miami', 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2', 'seller', true, false),
('c0000000-0000-0000-0000-000000000001', 'client1@oscorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'João', 'Silva', '+1 234 567 8903', '321 Client Blvd', 'Chicago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1', 'client', true, true),
('c0000000-0000-0000-0000-000000000002', 'client2@oscorp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'Souza', '+1 234 567 8904', '654 User Lane', 'Boston', 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2', 'client', true, false);

-- ============================================
-- 2. WALLETS (Carteiras)
-- ============================================
INSERT INTO "wallets" ("id", "userId", "balance", "currency", "status", "dailyLimit", "monthlyLimit", "totalIn", "totalOut") VALUES 
('w0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 10000, 'USD', 'active', 5000, 50000, 10000, 0),
('w0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 2500, 'USD', 'active', 1000, 10000, 5000, 2500),
('w0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 1800, 'USD', 'active', 1000, 10000, 3500, 1700),
('w0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 500, 'USD', 'active', 500, 5000, 2000, 1500),
('w0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 150, 'USD', 'active', 300, 3000, 800, 650);

-- ============================================
-- 3. VIRTUAL CARDS (Cartões QR)
-- ============================================
INSERT INTO "virtual_cards" ("id", "userId", "walletId", "cardNumber", "qrData", "design", "isActive") VALUES 
('v0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'OSC000001', '{"userId":"a0000000-0000-0000-0000-000000000001","cardNumber":"OSC000001"}', 'gradient_dark', true),
('v0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'OSC000002', '{"userId":"b0000000-0000-0000-0000-000000000001","cardNumber":"OSC000002"}', 'gradient_blue', true),
('v0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000003', 'OSC000003', '{"userId":"b0000000-0000-0000-0000-000000000002","cardNumber":"OSC000003"}', 'gradient_purple', true),
('v0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000004', 'OSC000004', '{"userId":"c0000000-0000-0000-0000-000000000001","cardNumber":"OSC000004"}', 'gradient_blue', true),
('v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000005', 'OSC000005', '{"userId":"c0000000-0000-0000-0000-000000000002","cardNumber":"OSC000005"}', 'gradient_purple', true);

-- ============================================
-- 4. SELLER PROFILES (Apenas para sellers)
-- ============================================
INSERT INTO "seller_profiles" ("id", "userId", "storeName", "storeSlug", "description", "logo", "banner", "address", "phone", "email", "whatsappNumber", "isVerified", "planActive", "commissionRate", "totalSales", "totalRevenue", "rating", "reviewCount", "businessHours", "socialLinks") VALUES 
('s0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Tech Store Pro', 'tech-store-pro', 'A melhor loja de tecnologia da região. Oferecemos os melhores produtos com preços competitivos.', 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200', '456 Seller Ave, Los Angeles', '+1 234 567 8901', 'seller1@oscorp.com', '+12345678901', true, true, 5.0, 150, 15000, 4.8, 45, '{"monday":{"open":"09:00","close":"18:00","isOpen":true},"tuesday":{"open":"09:00","close":"18:00","isOpen":true},"wednesday":{"open":"09:00","close":"18:00","isOpen":true},"thursday":{"open":"09:00","close":"18:00","isOpen":true},"friday":{"open":"09:00","close":"18:00","isOpen":true},"saturday":{"open":"10:00","close":"14:00","isOpen":true},"sunday":{"open":"10:00","close":"14:00","isOpen":false}}', '{"facebook":"https://facebook.com/techstorepro","instagram":"https://instagram.com/techstorepro","website":"https://techstorepro.com"}'),
('s0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Fashion Trends', 'fashion-trends', 'Moda e estilo para todas as ocasiões. Encontre as últimas tendências da temporada.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', '789 Market St, Miami', '+1 234 567 8902', 'seller2@oscorp.com', '+12345678902', true, true, 5.0, 89, 8900, 4.5, 28, '{"monday":{"open":"10:00","close":"20:00","isOpen":true},"tuesday":{"open":"10:00","close":"20:00","isOpen":true},"wednesday":{"open":"10:00","close":"20:00","isOpen":true},"thursday":{"open":"10:00","close":"20:00","isOpen":true},"friday":{"open":"10:00","close":"21:00","isOpen":true},"saturday":{"open":"10:00","close":"21:00","isOpen":true},"sunday":{"open":"12:00","close":"18:00","isOpen":true}}', '{"instagram":"https://instagram.com/fashiontrends","facebook":"https://facebook.com/fashiontrends"}');

-- ============================================
-- 5. STORES (Lojas)
-- ============================================
INSERT INTO "stores" ("id", "sellerId", "name", "slug", "description", "logo", "banner", "address", "phone", "email", "whatsappNumber", "isActive", "isOnline", "businessHours", "socialLinks") VALUES 
('st0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'Tech Store Pro', 'tech-store-pro', 'A melhor loja de tecnologia da região.', 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200', '456 Seller Ave, Los Angeles', '+1 234 567 8901', 'seller1@oscorp.com', '+12345678901', true, true, '{"monday":{"open":"09:00","close":"18:00","isOpen":true},"tuesday":{"open":"09:00","close":"18:00","isOpen":true},"wednesday":{"open":"09:00","close":"18:00","isOpen":true},"thursday":{"open":"09:00","close":"18:00","isOpen":true},"friday":{"open":"09:00","close":"18:00","isOpen":true},"saturday":{"open":"10:00","close":"14:00","isOpen":true},"sunday":{"open":"10:00","close":"14:00","isOpen":false}}', '{"facebook":"https://facebook.com/techstorepro","instagram":"https://instagram.com/techstorepro","website":"https://techstorepro.com"}'),
('st0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'Fashion Trends', 'fashion-trends', 'Moda e estilo para todas as ocasiões.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', '789 Market St, Miami', '+1 234 567 8902', 'seller2@oscorp.com', '+12345678902', true, true, '{"monday":{"open":"10:00","close":"20:00","isOpen":true},"tuesday":{"open":"10:00","close":"20:00","isOpen":true},"wednesday":{"open":"10:00","close":"20:00","isOpen":true},"thursday":{"open":"10:00","close":"20:00","isOpen":true},"friday":{"open":"10:00","close":"21:00","isOpen":true},"saturday":{"open":"10:00","close":"21:00","isOpen":true},"sunday":{"open":"12:00","close":"18:00","isOpen":true}}', '{"instagram":"https://instagram.com/fashiontrends","facebook":"https://facebook.com/fashiontrends"}');

-- ============================================
-- 6. BANK DATA (Apenas para client1)
-- ============================================
INSERT INTO "bank_data" ("id", "userId", "bankName", "accountNumber", "accountType", "holderName", "documentId") VALUES 
('bd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Bank of America', '1234567890', 'checking', 'João Silva', '123456789');

-- ============================================
-- VERIFICAR INSERÇÕES
-- ============================================
SELECT 'Usuários' as tabela, COUNT(*) as total FROM users
UNION ALL SELECT 'Wallets', COUNT(*) FROM wallets
UNION ALL SELECT 'Virtual Cards', COUNT(*) FROM virtual_cards
UNION ALL SELECT 'Seller Profiles', COUNT(*) FROM seller_profiles
UNION ALL SELECT 'Stores', COUNT(*) FROM stores
UNION ALL SELECT 'Bank Data', COUNT(*) FROM bank_data;
