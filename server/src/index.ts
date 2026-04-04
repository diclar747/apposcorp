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
import setupRoutes from './routes/setup.js';
import fixLoginRoutes from './routes/fix-login.js';
import { prisma } from './utils/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

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
      select: { id: true, email: true, role: true, firstName: true }
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
app.use('/api/stores', storeRoutes);
app.use('/api/seller-management', sellerManagementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ingenio', ingenioRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/fix', fixLoginRoutes);

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
