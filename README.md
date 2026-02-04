# 🚀 Oscorp Platform

Plataforma completa de e-commerce, fintech e e-learning com PostgreSQL + Express + React + TypeScript.

## 📋 Funcionalidades

### 👤 Perfis de Usuário
- **Cliente**: Compras, carteira digital, cursos, créditos, finanças pessoais
- **Vendedor**: Dashboard, gerenciamento de produtos, pedidos, relatórios
- **Superadmin**: Gestão completa da plataforma

### 💰 Módulos Financeiros
- **Wallet Digital**: Billetera virtual com saldo
- **Tarjeta Virtual QR**: Pagamento via código QR
- **Créditos**: Sistema de empréstimos com parcelamento
- **Ingenio Millonario**: Gestão financeira pessoal

### 🛒 E-commerce
- Lojas públicas e privadas
- Produtos (físicos, digitais, serviços)
- Carrinho de compras
- Checkout com múltiplos métodos de pagamento
- Rastreamento de pedidos

### 📚 E-learning
- Cursos com módulos e lições
- Progresso do aluno
- Certificados

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Express.js + TypeScript |
| ORM | Prisma |
| Banco de Dados | PostgreSQL (Neon) |
| Estado | Zustand |
| Query | TanStack Query |
| Formulários | React Hook Form + Zod |

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)

### 1. Clone o repositório

```bash
git clone https://github.com/diclar747/apposcorp.git
cd apposcorp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database Configuration - Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secret
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# API Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 4. Configure o banco de dados

```bash
# Gerar o cliente Prisma
npm run db:generate

# Aplicar as migrations ao banco
npm run db:push

# Popular o banco com dados de teste
npm run db:seed
```

### 5. Inicie os servidores

#### Modo desenvolvimento (ambos simultaneamente):
```bash
npm run dev:full
```

#### Ou separadamente:
```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
npm run dev
```

### 6. Acesse a aplicação

- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- Health Check: http://localhost:3001/health

## 🔑 Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@oscorp.com | 123456 |
| Vendedor 1 | seller1@oscorp.com | 123456 |
| Vendedor 2 | seller2@oscorp.com | 123456 |
| Cliente 1 | client1@oscorp.com | 123456 |
| Cliente 2 | client2@oscorp.com | 123456 |

## 📁 Estrutura do Projeto

```
apposcorp/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados iniciais
├── server/
│   └── src/
│       ├── index.ts       # Entry point do servidor
│       ├── routes/        # Rotas da API
│       ├── middleware/    # Middlewares (auth)
│       └── utils/         # Utilitários (prisma, jwt)
├── src/
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas
│   ├── stores/           # Zustand stores
│   ├── types/            # Tipos TypeScript
│   └── lib/
│       └── api.ts        # Cliente API
└── package.json
```

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual
- `PUT /api/auth/me` - Atualizar usuário

### Users
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter usuário
- `PATCH /api/users/:id/status` - Atualizar status

### Products
- `GET /api/products` - Listar produtos
- `GET /api/products/featured` - Produtos em destaque
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Orders
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/:id` - Obter pedido
- `POST /api/orders` - Criar pedido
- `PATCH /api/orders/:id/status` - Atualizar status

### Wallet
- `GET /api/wallet` - Obter carteira
- `GET /api/wallet/transactions` - Transações
- `POST /api/wallet/deposit` - Depositar
- `POST /api/wallet/transfer` - Transferir
- `GET /api/wallet/card` - Cartão virtual

### Courses
- `GET /api/courses` - Listar cursos
- `GET /api/courses/:id` - Obter curso
- `POST /api/courses` - Criar curso (admin)
- `POST /api/courses/:id/enroll` - Matricular
- `GET /api/courses/my/enrollments` - Minhas matrículas

### Credits
- `GET /api/credits` - Meus créditos
- `POST /api/credits` - Solicitar crédito
- `PATCH /api/credits/:id/approve` - Aprovar (admin)
- `POST /api/credits/:id/pay` - Pagar parcela

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Frontend
npm run server:dev       # Backend
npm run dev:full         # Ambos simultaneamente

# Banco de dados
npm run db:generate      # Gerar cliente Prisma
npm run db:migrate       # Criar migration
npm run db:push          # Aplicar ao banco
npm run db:studio        # Prisma Studio (GUI)
npm run db:seed          # Popular dados

# Build
npm run build            # Build frontend
npm run server:build     # Build backend
```

## 📄 Licença

Este projeto é privado e de uso exclusivo.

---

Desenvolvido com ❤️ pela equipe Oscorp.
