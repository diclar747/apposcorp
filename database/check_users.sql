-- ============================================
-- VERIFICAR USUÁRIOS NO BANCO
-- Execute no console do Neon
-- ============================================

-- Ver todos os usuários
SELECT id, email, "firstName", "lastName", role, "isActive", "createdAt"
FROM users;

-- Verificar se a senha está correta (teste com '123456')
-- A senha hasheada deve começar com $2a$10$
SELECT email, password 
FROM users 
WHERE email = 'admin@oscorp.com';

-- Contar registros em todas as tabelas importantes
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL SELECT 'virtual_cards', COUNT(*) FROM virtual_cards
UNION ALL SELECT 'seller_profiles', COUNT(*) FROM seller_profiles
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'courses', COUNT(*) FROM courses;
