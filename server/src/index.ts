import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

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

// Simple setup endpoint
app.get('/api/setup', async (req, res) => {
  try {
    const plainPassword = '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Crear o actualizar admin
    await prisma.user.upsert({
      where: { email: 'admin@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'admin@oscorp.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Oscorp',
        phone: '0000000000',
        address: 'Test Address',
        city: 'Test City',
        role: 'superadmin',
        isActive: true
      }
    });
    
    // Crear o actualizar seller1
    await prisma.user.upsert({
      where: { email: 'seller1@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'seller1@oscorp.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Vendedor',
        phone: '0000000001',
        address: 'Test Address',
        city: 'Test City',
        role: 'seller',
        isActive: true
      }
    });
    
    // Crear o actualizar client1
    await prisma.user.upsert({
      where: { email: 'client1@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'client1@oscorp.com',
        password: hashedPassword,
        firstName: 'Joao',
        lastName: 'Silva',
        phone: '0000000003',
        address: 'Test Address',
        city: 'Test City',
        role: 'client',
        isActive: true
      }
    });
    
    res.json({
      success: true,
      message: 'Usuarios creados/actualizados',
      credentials: {
        admin: { email: 'admin@oscorp.com', password: '123456' },
        seller: { email: 'seller1@oscorp.com', password: '123456' },
        client: { email: 'client1@oscorp.com', password: '123456' }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resetear contraseña del admin existente
app.get('/api/fix-admin-password', async (req, res) => {
  try {
    const plainPassword = '123456';
    const hash = await bcrypt.hash(plainPassword, 10);
    
    // Actualizar TODOS los usuarios demo con la misma contraseña
    const emails = [
      'admin@oscorp.com',
      'seller1@oscorp.com', 
      'client1@oscorp.com'
    ];
    
    const results = [];
    for (const email of emails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true }
      });
      
      if (user) {
        // Verificar si la contraseña actual funciona
        const currentValid = await bcrypt.compare(plainPassword, user.password);
        
        if (!currentValid) {
          // Actualizar con nueva contraseña
          await prisma.user.update({
            where: { email },
            data: { password: hash, isActive: true }
          });
          results.push({ email, action: 'password_reset', previousValid: currentValid });
        } else {
          results.push({ email, action: 'no_change', passwordAlreadyValid: true });
        }
      } else {
        results.push({ email, action: 'user_not_found' });
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Contraseñas verificadas/actualizadas',
      results,
      credentials: { email: 'admin@oscorp.com', password: '123456' }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
