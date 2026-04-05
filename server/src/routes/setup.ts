import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Setup endpoint - cria todos os usuários de teste
router.get('/', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const results = [];

    // 1. Criar/Atualizar Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'admin@oscorp.com',
        password: hashedPassword,
        firstName: 'Administrador',
        lastName: 'Oscorp',
        phone: '+1 234 567 8900',
        address: '123 Admin Street',
        city: 'New York',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'superadmin',
        isActive: true,
        ingenioAccess: true,
        wallet: { create: { balance: 10000, currency: 'USD' } }
      },
      include: { wallet: true }
    });

    // Criar cartão virtual para admin se não existir
    await prisma.virtualCard.upsert({
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
    results.push({ email: admin.email, role: admin.role, status: 'ok' });

    // 2. Criar Seller 1
    const seller1 = await prisma.user.upsert({
      where: { email: 'seller1@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'seller1@oscorp.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Vendedor',
        phone: '+1 234 567 8901',
        address: '456 Seller Ave',
        city: 'Los Angeles',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1',
        role: 'seller',
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
    results.push({ email: seller1.email, role: seller1.role, status: 'ok' });

    // 3. Criar Client 1
    const client1 = await prisma.user.upsert({
      where: { email: 'client1@oscorp.com' },
      update: { password: hashedPassword, isActive: true },
      create: {
        email: 'client1@oscorp.com',
        password: hashedPassword,
        firstName: 'João',
        lastName: 'Silva',
        phone: '+1 234 567 8903',
        address: '321 Client Blvd',
        city: 'Chicago',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
        role: 'client',
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
    results.push({ email: client1.email, role: client1.role, status: 'ok' });

    res.json({
      message: 'Usuários criados/atualizados com sucesso!',
      users: results,
      credentials: {
        admin: { email: 'admin@oscorp.com', password: '123456' },
        seller1: { email: 'seller1@oscorp.com', password: '123456' },
        client1: { email: 'client1@oscorp.com', password: '123456' },
      }
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

export default router;
