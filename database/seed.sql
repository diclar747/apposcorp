-- ============================================
-- OSCORP PLATFORM - SEED DATA
-- PostgreSQL (Neon)
-- ============================================

-- Enable pgcrypto for password hashing (optional, or use bcrypt in app)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS (Password: 123456 - hashed with bcrypt)
-- ============================================

-- Admin User
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive", "ingenioAccess")
VALUES 
('a0000000-0000-0000-0000-000000000001', 'admin@oscorp.com', '$2a$10$YourHashedPasswordHere', 'Administrador', 'Oscorp', '+1 234 567 8900', '123 Admin Street', 'New York', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'superadmin', true, true);

-- Seller 1
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive")
VALUES 
('b0000000-0000-0000-0000-000000000001', 'seller1@oscorp.com', '$2a$10$YourHashedPasswordHere', 'Carlos', 'Vendedor', '+1 234 567 8901', '456 Seller Ave', 'Los Angeles', 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1', 'seller', true);

-- Seller 2
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive")
VALUES 
('b0000000-0000-0000-0000-000000000002', 'seller2@oscorp.com', '$2a$10$YourHashedPasswordHere', 'Maria', 'Loja', '+1 234 567 8902', '789 Market St', 'Miami', 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2', 'seller', true);

-- Client 1
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive", "ingenioAccess")
VALUES 
('c0000000-0000-0000-0000-000000000001', 'client1@oscorp.com', '$2a$10$YourHashedPasswordHere', 'João', 'Silva', '+1 234 567 8903', '321 Client Blvd', 'Chicago', 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1', 'client', true, true);

-- Client 2
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "phone", "address", "city", "avatar", "role", "isActive")
VALUES 
('c0000000-0000-0000-0000-000000000002', 'client2@oscorp.com', '$2a$10$YourHashedPasswordHere', 'Ana', 'Souza', '+1 234 567 8904', '654 User Lane', 'Boston', 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2', 'client', true, false);

-- ============================================
-- WALLETS
-- ============================================
INSERT INTO "wallets" ("id", "userId", "balance", "currency", "status", "dailyLimit", "monthlyLimit", "totalIn", "totalOut")
VALUES 
('w0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 10000, 'USD', 'active', 5000, 50000, 10000, 0),
('w0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 2500, 'USD', 'active', 1000, 10000, 5000, 2500),
('w0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 1800, 'USD', 'active', 1000, 10000, 3500, 1700),
('w0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 500, 'USD', 'active', 500, 5000, 2000, 1500),
('w0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 150, 'USD', 'active', 300, 3000, 800, 650);

-- ============================================
-- VIRTUAL CARDS
-- ============================================
INSERT INTO "virtual_cards" ("id", "userId", "walletId", "cardNumber", "qrData", "design", "isActive")
VALUES 
('v0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'OSC000001', '{"cardNumber":"OSC000001"}', 'gradient_dark', true),
('v0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'OSC000002', '{"cardNumber":"OSC000002"}', 'gradient_blue', true),
('v0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000003', 'OSC000003', '{"cardNumber":"OSC000003"}', 'gradient_purple', true),
('v0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000004', 'OSC000004', '{"cardNumber":"OSC000004"}', 'gradient_blue', true),
('v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000005', 'OSC000005', '{"cardNumber":"OSC000005"}', 'gradient_purple', true);

-- ============================================
-- SELLER PROFILES
-- ============================================
INSERT INTO "seller_profiles" ("id", "userId", "storeName", "storeSlug", "description", "logo", "banner", "address", "phone", "email", "whatsappNumber", "isVerified", "planActive", "commissionRate", "totalSales", "totalRevenue", "rating", "reviewCount", "businessHours", "socialLinks")
VALUES 
('s0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Tech Store Pro', 'tech-store-pro', 'A melhor loja de tecnologia da região. Oferecemos os melhores produtos com preços competitivos.', 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200', '456 Seller Ave, Los Angeles', '+1 234 567 8901', 'seller1@oscorp.com', '+12345678901', true, true, 5.0, 150, 15000, 4.8, 45, 
'{"monday":{"open":"09:00","close":"18:00","isOpen":true},"tuesday":{"open":"09:00","close":"18:00","isOpen":true},"wednesday":{"open":"09:00","close":"18:00","isOpen":true},"thursday":{"open":"09:00","close":"18:00","isOpen":true},"friday":{"open":"09:00","close":"18:00","isOpen":true},"saturday":{"open":"10:00","close":"14:00","isOpen":true},"sunday":{"open":"10:00","close":"14:00","isOpen":false}}',
'{"facebook":"https://facebook.com/techstorepro","instagram":"https://instagram.com/techstorepro","website":"https://techstorepro.com"}'),

('s0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Fashion Trends', 'fashion-trends', 'Moda e estilo para todas as ocasiões. Encontre as últimas tendências da temporada.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', '789 Market St, Miami', '+1 234 567 8902', 'seller2@oscorp.com', '+12345678902', true, true, 5.0, 89, 8900, 4.5, 28,
'{"monday":{"open":"10:00","close":"20:00","isOpen":true},"tuesday":{"open":"10:00","close":"20:00","isOpen":true},"wednesday":{"open":"10:00","close":"20:00","isOpen":true},"thursday":{"open":"10:00","close":"20:00","isOpen":true},"friday":{"open":"10:00","close":"21:00","isOpen":true},"saturday":{"open":"10:00","close":"21:00","isOpen":true},"sunday":{"open":"12:00","close":"18:00","isOpen":true}}',
'{"instagram":"https://instagram.com/fashiontrends","facebook":"https://facebook.com/fashiontrends"}');

-- ============================================
-- STORES
-- ============================================
INSERT INTO "stores" ("id", "sellerId", "name", "slug", "description", "logo", "banner", "address", "phone", "email", "whatsappNumber", "isActive", "isOnline", "businessHours", "socialLinks")
VALUES 
('st0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'Tech Store Pro', 'tech-store-pro', 'A melhor loja de tecnologia da região.', 'https://images.unsplash.com/photo-1531297424006-0145f3c06e78?w=200', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200', '456 Seller Ave, Los Angeles', '+1 234 567 8901', 'seller1@oscorp.com', '+12345678901', true, true,
'{"monday":{"open":"09:00","close":"18:00","isOpen":true},"tuesday":{"open":"09:00","close":"18:00","isOpen":true},"wednesday":{"open":"09:00","close":"18:00","isOpen":true},"thursday":{"open":"09:00","close":"18:00","isOpen":true},"friday":{"open":"09:00","close":"18:00","isOpen":true},"saturday":{"open":"10:00","close":"14:00","isOpen":true},"sunday":{"open":"10:00","close":"14:00","isOpen":false}}',
'{"facebook":"https://facebook.com/techstorepro","instagram":"https://instagram.com/techstorepro","website":"https://techstorepro.com"}'),

('st0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'Fashion Trends', 'fashion-trends', 'Moda e estilo para todas as ocasiões.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', '789 Market St, Miami', '+1 234 567 8902', 'seller2@oscorp.com', '+12345678902', true, true,
'{"monday":{"open":"10:00","close":"20:00","isOpen":true},"tuesday":{"open":"10:00","close":"20:00","isOpen":true},"wednesday":{"open":"10:00","close":"20:00","isOpen":true},"thursday":{"open":"10:00","close":"20:00","isOpen":true},"friday":{"open":"10:00","close":"21:00","isOpen":true},"saturday":{"open":"10:00","close":"21:00","isOpen":true},"sunday":{"open":"12:00","close":"18:00","isOpen":true}}',
'{"instagram":"https://instagram.com/fashiontrends","facebook":"https://facebook.com/fashiontrends"}');

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO "products" ("id", "sellerId", "name", "description", "price", "comparePrice", "stock", "sku", "images", "category", "subcategory", "type", "visibility", "status", "tags", "isFeatured")
VALUES 
('p0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'iPhone 15 Pro Max', 'O iPhone 15 Pro Max tem design em titânio robusto e leve, com parte traseira em vidro matte texturizado.', 1199, 1299, 25, 'TECH-001', 
ARRAY['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800'], 'Tecnologia', 'Smartphones', 'physical', 'both', 'active', ARRAY['apple', 'iphone', 'smartphone'], true),

('p0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', 'MacBook Pro 14" M3', 'O MacBook Pro com chip M3 é o laptop mais avançado para profissionais exigentes.', 1999, 2199, 15, 'TECH-002', 
ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'], 'Tecnologia', 'Laptops', 'physical', 'both', 'active', ARRAY['apple', 'macbook', 'laptop'], true),

('p0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000001', 'Sony WH-1000XM5', 'Fones de ouvido com cancelamento de ruído líder da indústria e som premium.', 399, 449, 30, 'TECH-003', 
ARRAY['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'], 'Tecnologia', 'Áudio', 'physical', 'online', 'active', ARRAY['sony', 'headphones', 'audio'], false),

('p0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000002', 'Vestido Elegante Floral', 'Vestido longo estampado floral perfeito para ocasiões especiais. Tecido leve e confortável.', 89, 129, 50, 'FASH-001', 
ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'], 'Moda', 'Vestidos', 'physical', 'both', 'active', ARRAY['vestido', 'floral', 'elegante'], true),

('p0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000002', 'Tênis Esportivo Premium', 'Tênis de alta performance para corrida e treino. Tecnologia de amortecimento avançada.', 159, NULL, 40, 'FASH-002', 
ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'], 'Moda', 'Calçados', 'physical', 'both', 'active', ARRAY['tênis', 'esportivo', 'corrida'], false),

('p0000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000002', 'Bolsa de Couro Italiano', 'Bolsa artesanal em couro genuíno italiano. Design atemporal e qualidade superior.', 249, 349, 20, 'FASH-003', 
ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'], 'Moda', 'Acessórios', 'physical', 'both', 'active', ARRAY['bolsa', 'couro', 'italiano'], false);

-- ============================================
-- PRODUCT ATTRIBUTES
-- ============================================
INSERT INTO "product_attributes" ("id", "productId", "name", "value")
VALUES 
('pa0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Marca', 'Apple'),
('pa0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'Memória', '256GB'),
('pa0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'Cor', 'Titanium Natural');

-- ============================================
-- COURSES
-- ============================================
INSERT INTO "courses" ("id", "title", "slug", "description", "shortDescription", "coverImage", "instructorId", "instructorName", "category", "level", "price", "comparePrice", "duration", "isPublished", "isFeatured", "enrolledCount", "rating", "reviewCount")
VALUES 
('co0000000-0000-0000-0000-000000000001', 'Finanças Pessoais para Iniciantes', 'financas-pessoais-iniciantes', 'Aprenda a gerenciar suas finanças pessoais de forma eficiente. Desde orçamento até investimentos.', 'Domine suas finanças pessoais e alcance a liberdade financeira.', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800', 'a0000000-0000-0000-0000-000000000001', 'Oscorp Academy', 'Finanças', 'beginner', 49, 99, 480, true, true, 1250, 4.8, 342),

('co0000000-0000-0000-0000-000000000002', 'Marketing Digital para Empreendedores', 'marketing-digital-empreendedores', 'Estratégias práticas de marketing digital para alavancar seu negócio online.', 'Aprenda a promover seu negócio nas redes sociais e mecanismos de busca.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', 'a0000000-0000-0000-0000-000000000001', 'Oscorp Academy', 'Marketing', 'intermediate', 79, 149, 720, true, true, 890, 4.6, 215);

-- ============================================
-- MODULES
-- ============================================
INSERT INTO "modules" ("id", "courseId", "title", "description", "order")
VALUES 
('m0000000-0000-0000-0000-000000000001', 'co0000000-0000-0000-0000-000000000001', 'Módulo 1: Fundamentos', 'Conceitos básicos de finanças pessoais', 1),
('m0000000-0000-0000-0000-000000000002', 'co0000000-0000-0000-0000-000000000001', 'Módulo 2: Orçamento', 'Como criar e manter um orçamento efetivo', 2),
('m0000000-0000-0000-0000-000000000003', 'co0000000-0000-0000-0000-000000000001', 'Módulo 3: Investimentos', 'Primeiros passos no mundo dos investimentos', 3),
('m0000000-0000-0000-0000-000000000004', 'co0000000-0000-0000-0000-000000000002', 'Fundamentos do Marketing Digital', 'Conceitos essenciais para iniciar', 1),
('m0000000-0000-0000-0000-000000000005', 'co0000000-0000-0000-0000-000000000002', 'Redes Sociais', 'Estratégias para Instagram, Facebook e TikTok', 2);

-- ============================================
-- LESSONS
-- ============================================
INSERT INTO "lessons" ("id", "moduleId", "title", "description", "duration", "order", "isPreview")
VALUES 
('l0000000-0000-0000-0000-000000000001', 'm0000000-0000-0000-0000-000000000001', 'Introdução às Finanças Pessoais', 'Conhecendo os conceitos básicos', 15, 1, true),
('l0000000-0000-0000-0000-000000000002', 'm0000000-0000-0000-0000-000000000001', 'Consciência Financeira', 'Entendendo seu comportamento com dinheiro', 20, 2, false),
('l0000000-0000-0000-0000-000000000003', 'm0000000-0000-0000-0000-000000000001', 'Mentalidade de Abundância', 'Transformando sua relação com o dinheiro', 25, 3, false),
('l0000000-0000-0000-0000-000000000004', 'm0000000-0000-0000-0000-000000000002', 'Análise de Renda e Gastos', 'Mapeando suas finanças', 30, 1, false),
('l0000000-0000-0000-0000-000000000005', 'm0000000-0000-0000-0000-000000000002', 'Regra 50-30-20', 'Como dividir sua renda', 25, 2, false),
('l0000000-0000-0000-0000-000000000006', 'm0000000-0000-0000-0000-000000000004', 'O que é Marketing Digital', 'Entendendo o cenário digital', 20, 1, true);

-- ============================================
-- TRANSACTIONS
-- ============================================
INSERT INTO "transactions" ("id", "walletId", "userId", "type", "amount", "currency", "description", "status")
VALUES 
('t0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'deposit', 500, 'USD', 'Depósito inicial', 'completed'),
('t0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'purchase', -199, 'USD', 'Compra: iPhone 15 Pro Max', 'completed'),
('t0000000-0000-0000-0000-000000000003', 'w0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'deposit', 300, 'USD', 'Depósito', 'completed'),
('t0000000-0000-0000-0000-000000000004', 'w0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'purchase', -89, 'USD', 'Compra: Vestido Elegante', 'completed'),
('t0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'sale', 199, 'USD', 'Venda: iPhone 15 Pro Max', 'completed');

-- ============================================
-- FINANCIAL CATEGORIES (for client1)
-- ============================================
INSERT INTO "financial_categories" ("id", "userId", "name", "type", "color", "icon", "isDefault")
VALUES 
('fc0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Salário', 'income', '#10B981', 'dollar-sign', true),
('fc0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Freelance', 'income', '#3B82F6', 'briefcase', true),
('fc0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Alimentação', 'expense', '#EF4444', 'utensils', true),
('fc0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Transporte', 'expense', '#F59E0B', 'car', true),
('fc0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Moradia', 'expense', '#8B5CF6', 'home', true),
('fc0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'Lazer', 'expense', '#EC4899', 'gamepad-2', true);

-- ============================================
-- NOTIFICATIONS
-- ============================================
INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "isRead")
VALUES 
('n0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Bem-vindo!', 'Bem-vindo à plataforma Oscorp!', 'success', false),
('n0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Novo curso disponível', 'O curso "Finanças Pessoais" está disponível!', 'info', false),
('n0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Nova venda', 'Você tem uma nova venda!', 'success', false),
('n0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sistema atualizado', 'O sistema foi atualizado com sucesso.', 'info', false);
