import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import walletRoutes from './routes/wallet.js';
import creditRoutes from './routes/credits.js';
import notificationRoutes from './routes/notifications.js';
import financeRoutes from './routes/finances.js';
import settingsRoutes from './routes/settings.js';
import supplierRoutes from './routes/suppliers.js';
import customerRoutes from './routes/customers.js';
import purchaseRoutes from './routes/purchases.js';
import courseRoutes from './routes/courses.js';
import pushRoutes from './routes/push.js';
import storeRoutes from './routes/stores.js';
import sellerManagementRoutes from './routes/seller-management.js';
import reportRoutes from './routes/reports.js';
import ingenioRoutes from './routes/ingenio.js';
import uploadRoutes from './routes/upload.js';
import planRoutes from './routes/plans.js';
import reviewRoutes from './routes/reviews.js';
import { prisma } from './utils/prisma.js';
import webpush from 'web-push';
import { checkMaintenanceMode } from './middleware/maintenance.js';

// Configure Web Push if keys are present
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  const publicKey = process.env.VAPID_PUBLIC_KEY.trim().replace(/['"]+/g, '');
  const privateKey = process.env.VAPID_PRIVATE_KEY.trim().replace(/['"]+/g, '');
  
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@oscorp.com'}`,
    publicKey,
    privateKey
  );
  console.log('🔔 Web Push configurado correctamente');
  console.log('🗝️ VAPID Public Key (start):', publicKey.substring(0, 10) + '...');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Serve uploaded files statically (local dev only, Vercel uses /tmp)
const uploadsDir = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(process.cwd(), 'server', 'uploads');
app.use('/api/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database check
app.get('/api/health/db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, roles: true, firstName: true }
    });
    res.json({
      status: 'ok',
      userCount,
      users,
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
    });
  }
});

// Maintenance mode check
app.use(checkMaintenanceMode);

// API Routes
import campaignRoutes from './routes/campaigns.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/seller-management', sellerManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ingenio', ingenioRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);

// Setup endpoint - cria todos os usuários de teste
app.get('/api/setup', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const results = [];

    // 1. Criar/Atualizar Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@oscorp.com' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@oscorp.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Oscorp',
        phone: '+1 234 567 8900',
        address: '123 Admin Street',
        city: 'New York',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        roles: ['superadmin'],
        isActive: true,
        ingenioAccess: true,
        wallet: { create: { balance: 10000, currency: 'USD' } }
      },
      include: { wallet: true }
    });

    // Criar cartão virtual para admin se não existir
    const adminCard = await prisma.virtualCard.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        walletId: admin.wallet!.id,
        cardNumber: 'OSC000001',
        qrData: JSON.stringify({ userId: admin.id, cardNumber: 'OSC000001' }),
        design: 'gradient_dark',
      }
    });
    results.push({ email: admin.email, roles: admin.roles, status: 'ok' });

    // 2. Criar Seller 1
    const seller1 = await prisma.user.upsert({
      where: { email: 'seller1@oscorp.com' },
      update: { password: hashedPassword },
      create: {
        email: 'seller1@oscorp.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Vendedor',
        phone: '+1 234 567 8901',
        address: '456 Seller Ave',
        city: 'Los Angeles',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1',
        roles: ['seller'],
        isActive: true,
        wallet: { create: { balance: 2500, currency: 'USD', totalIn: 5000, totalOut: 2500 } }
      },
      include: { wallet: true }
    });

    await prisma.virtualCard.upsert({
      where: { userId: seller1.id },
      update: {},
      create: {
        userId: seller1.id,
        walletId: seller1.wallet!.id,
        cardNumber: 'OSC000002',
        qrData: JSON.stringify({ userId: seller1.id, cardNumber: 'OSC000002' }),
        design: 'gradient_blue',
      }
    });

    await prisma.sellerProfile.upsert({
      where: { userId: seller1.id },
      update: {},
      create: {
        userId: seller1.id,
        storeName: 'Tech Store Pro',
        storeSlug: 'tech-store-pro',
        description: 'A melhor loja de tecnologia da região.',
        address: '456 Seller Ave, Los Angeles',
        phone: '+1 234 567 8901',
        email: 'seller1@oscorp.com',
        whatsappNumber: '+12345678901',
        isVerified: true,
        planActive: true,
        commissionRate: 5,
        totalSales: 150,
        totalRevenue: 15000,
        rating: 4.8,
        reviewCount: 45,
      }
    });
    results.push({ email: seller1.email, roles: seller1.roles, status: 'ok' });

    // 3. Criar Seller 2
    const seller2 = await prisma.user.upsert({
      where: { email: 'seller2@oscorp.com' },
      update: { password: hashedPassword },
      create: {
        email: 'seller2@oscorp.com',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Loja',
        phone: '+1 234 567 8902',
        address: '789 Market St',
        city: 'Miami',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2',
        roles: ['seller'],
        isActive: true,
        wallet: { create: { balance: 1800, currency: 'USD', totalIn: 3500, totalOut: 1700 } }
      },
      include: { wallet: true }
    });

    await prisma.virtualCard.upsert({
      where: { userId: seller2.id },
      update: {},
      create: {
        userId: seller2.id,
        walletId: seller2.wallet!.id,
        cardNumber: 'OSC000003',
        qrData: JSON.stringify({ userId: seller2.id, cardNumber: 'OSC000003' }),
        design: 'gradient_purple',
      }
    });

    await prisma.sellerProfile.upsert({
      where: { userId: seller2.id },
      update: {},
      create: {
        userId: seller2.id,
        storeName: 'Fashion Trends',
        storeSlug: 'fashion-trends',
        description: 'Moda e estilo para todas as ocasiões.',
        address: '789 Market St, Miami',
        phone: '+1 234 567 8902',
        email: 'seller2@oscorp.com',
        whatsappNumber: '+12345678902',
        isVerified: true,
        planActive: true,
        commissionRate: 5,
        totalSales: 89,
        totalRevenue: 8900,
        rating: 4.5,
        reviewCount: 28,
      }
    });
    results.push({ email: seller2.email, roles: seller2.roles, status: 'ok' });

    // 4. Criar Client 1
    const client1 = await prisma.user.upsert({
      where: { email: 'client1@oscorp.com' },
      update: { password: hashedPassword },
      create: {
        email: 'client1@oscorp.com',
        password: hashedPassword,
        firstName: 'João',
        lastName: 'Silva',
        phone: '+1 234 567 8903',
        address: '321 Client Blvd',
        city: 'Chicago',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
        roles: ['client'],
        isActive: true,
        ingenioAccess: true,
        wallet: { create: { balance: 500, currency: 'USD', totalIn: 2000, totalOut: 1500 } }
      },
      include: { wallet: true }
    });

    await prisma.virtualCard.upsert({
      where: { userId: client1.id },
      update: {},
      create: {
        userId: client1.id,
        walletId: client1.wallet!.id,
        cardNumber: 'OSC000004',
        qrData: JSON.stringify({ userId: client1.id, cardNumber: 'OSC000004' }),
        design: 'gradient_blue',
      }
    });
    results.push({ email: client1.email, roles: client1.roles, status: 'ok' });

    // 5. Criar Client 2
    const client2 = await prisma.user.upsert({
      where: { email: 'client2@oscorp.com' },
      update: { password: hashedPassword },
      create: {
        email: 'client2@oscorp.com',
        password: hashedPassword,
        firstName: 'Ana',
        lastName: 'Souza',
        phone: '+1 234 567 8904',
        address: '654 User Lane',
        city: 'Boston',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2',
        roles: ['client'],
        isActive: true,
        wallet: { create: { balance: 150, currency: 'USD', totalIn: 800, totalOut: 650 } }
      },
      include: { wallet: true }
    });

    await prisma.virtualCard.upsert({
      where: { userId: client2.id },
      update: {},
      create: {
        userId: client2.id,
        walletId: client2.wallet!.id,
        cardNumber: 'OSC000005',
        qrData: JSON.stringify({ userId: client2.id, cardNumber: 'OSC000005' }),
        design: 'gradient_purple',
      }
    });
    results.push({ email: client2.email, roles: client2.roles, status: 'ok' });

    res.json({
      message: 'Todos os usuários criados/atualizados com sucesso!',
      users: results,
      credentials: {
        admin: { email: 'admin@oscorp.com', password: '123456' },
        seller1: { email: 'seller1@oscorp.com', password: '123456' },
        seller2: { email: 'seller2@oscorp.com', password: '123456' },
        client1: { email: 'client1@oscorp.com', password: '123456' },
        client2: { email: 'client2@oscorp.com', password: '123456' },
      }
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Only listen if not running on Vercel (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
  });
}

// Export for Vercel
export default app;
