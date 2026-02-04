import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import walletRoutes from './routes/wallet.js';
import courseRoutes from './routes/courses.js';
import creditRoutes from './routes/credits.js';
import { prisma } from './utils/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/credits', creditRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
});
