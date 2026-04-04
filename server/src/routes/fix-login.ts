import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint de emergencia para resetear contraseñas
router.get('/reset-passwords', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Actualizar todos los usuarios demo
    const users = [
      'admin@oscorp.com',
      'seller1@oscorp.com',
      'seller2@oscorp.com',
      'client1@oscorp.com',
      'client2@oscorp.com'
    ];

    const results = [];
    for (const email of users) {
      try {
        const user = await prisma.user.update({
          where: { email },
          data: { 
            password: hashedPassword,
            isActive: true 
          }
        });
        results.push({ email, status: 'updated' });
      } catch (e) {
        results.push({ email, status: 'not found' });
      }
    }

    // También crear usuarios si no existen
    const created = [];
    
    // Admin
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
        role: 'superadmin',
        isActive: true,
        wallet: { create: { balance: 10000, currency: 'USD' } }
      },
      include: { wallet: true }
    });
    created.push('admin@oscorp.com');

    // Crear/actualizar virtual card para admin
    if (admin.wallet) {
      await prisma.virtualCard.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
          userId: admin.id,
          walletId: admin.wallet.id,
          cardNumber: 'OSC000001',
          qrData: JSON.stringify({ userId: admin.id, cardNumber: 'OSC000001' }),
          design: 'gradient_dark',
        }
      });
    }

    // Seller 1
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
        role: 'seller',
        isActive: true,
        wallet: { create: { balance: 2500, currency: 'USD' } }
      },
      include: { wallet: true }
    });
    created.push('seller1@oscorp.com');

    if (seller1.wallet) {
      await prisma.virtualCard.upsert({
        where: { userId: seller1.id },
        update: {},
        create: {
          userId: seller1.id,
          walletId: seller1.wallet.id,
          cardNumber: 'OSC000002',
          qrData: JSON.stringify({ userId: seller1.id, cardNumber: 'OSC000002' }),
          design: 'gradient_blue',
        }
      });
    }

    // Client 1
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
        role: 'client',
        isActive: true,
        wallet: { create: { balance: 500, currency: 'USD' } }
      },
      include: { wallet: true }
    });
    created.push('client1@oscorp.com');

    if (client1.wallet) {
      await prisma.virtualCard.upsert({
        where: { userId: client1.id },
        update: {},
        create: {
          userId: client1.id,
          walletId: client1.wallet.id,
          cardNumber: 'OSC000004',
          qrData: JSON.stringify({ userId: client1.id, cardNumber: 'OSC000004' }),
          design: 'gradient_blue',
        }
      });
    }

    res.json({
      message: 'Contraseñas reseteadas exitosamente',
      results,
      created,
      credentials: {
        admin: { email: 'admin@oscorp.com', password: '123456' },
        seller1: { email: 'seller1@oscorp.com', password: '123456' },
        client1: { email: 'client1@oscorp.com', password: '123456' },
      }
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
