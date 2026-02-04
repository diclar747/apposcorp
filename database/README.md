# Database Setup - Oscorp Platform

## Conexão Neon PostgreSQL

```
postgresql://neondb_owner:npg_yNC4xBLH1MbS@ep-icy-bonus-ahtiwph6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Como criar as tabelas

### Opção 1: Usando o Console do Neon (Mais fácil)

1. Acesse: https://console.neon.tech
2. Faça login na sua conta
3. Selecione o projeto `neondb`
4. Vá em "SQL Editor"
5. Cole o conteúdo do arquivo `schema.sql`
6. Clique em "Run"

### Opção 2: Usando psql CLI

```bash
# Conectar ao banco
psql "postgresql://neondb_owner:npg_yNC4xBLH1MbS@ep-icy-bonus-ahtiwph6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Executar o schema
\i schema.sql

# Popular com dados (opcional)
\i seed.sql
```

### Opção 3: Usando Prisma (Recomendado)

```bash
# No diretório do projeto
cd d:\localhost\Kimi_Agent_Oscop\app

# Instalar dependências
npm install

# Gerar o cliente Prisma
npx prisma generate

# Aplicar o schema ao banco
npx prisma db push

# Popular com dados
npx prisma db seed
```

## Estrutura do Banco

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (client, seller, superadmin) |
| `wallets` | Carteiras digitais |
| `virtual_cards` | Cartões QR |
| `seller_profiles` | Perfis de vendedores |
| `stores` | Lojas |
| `products` | Produtos |
| `orders` | Pedidos |
| `courses` | Cursos |
| `credits` | Créditos/Empréstimos |
| `transactions` | Transações financeiras |

### Enums

- `UserRole`: client, seller, superadmin
- `OrderStatus`: pending, confirmed, preparing, ready, in_transit, delivered, cancelled, refunded
- `PaymentStatus`: pending, paid, failed, refunded
- `TransactionType`: income, expense, transfer_in, transfer_out, purchase, sale, etc.
- `CourseLevel`: beginner, intermediate, advanced
- `CreditStatus`: pending, approved, rejected, active, completed, defaulted

## Credenciais de Teste (após seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@oscorp.com | 123456 | Superadmin |
| seller1@oscorp.com | 123456 | Vendedor |
| seller2@oscorp.com | 123456 | Vendedor |
| client1@oscorp.com | 123456 | Cliente |
| client2@oscorp.com | 123456 | Cliente |

## Troubleshooting

### Erro: "relation already exists"
Execute primeiro:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Erro: "extension not found"
O Neon já tem a extensão `uuid-ossp` habilitada por padrão.

### Verificar tabelas criadas:
```sql
\dt
```

### Contar registros:
```sql
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'courses', COUNT(*) FROM courses;
```
