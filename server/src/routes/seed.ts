import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Seed endpoint - recreates users with correct passwords
router.get('/', async (req, res) => {
  try {
    // Specific hashing for different passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    // List of users from mockData.ts
    const usersToSync = [
      {
        id: 'user-1',
        email: 'admin@oscorp.com',
        password: adminPassword,
        role: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin'
      },
      {
        id: 'user-2',
        email: 'vendedor1@oscorp.com',
        password: sellerPassword,
        role: 'seller',
        firstName: 'Carlos',
        lastName: 'Martínez'
      },
      {
        id: 'user-4',
        email: 'cliente1@oscorp.com',
        password: clientPassword,
        role: 'client',
        firstName: 'Juan',
        lastName: 'Pérez'
      }
    ];

    const results = [];

    for (const user of usersToSync) {
      // Clean up existing user
      await prisma.user.deleteMany({
        where: {
          OR: [
            { id: user.id },
            { email: user.email }
          ]
        }
      });

      // Create user with specific ID
      const createdUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as any,
          isActive: true,
          ingenioAccess: true,
          wallet: {
            create: {
              balance: 1000000,
              currency: 'PYG'
            }
          }
        }
      });

      results.push({
        email: user.email,
        id: createdUser.id,
        role: user.role
      });
    }

    res.json({
      success: true,
      message: 'Usuarios recreados con contraseñas correctas',
      results,
      credentials: {
        admin: { email: 'admin@oscorp.com', password: 'admin123' },
        seller: { email: 'vendedor1@oscorp.com', password: 'seller123' },
        client: { email: 'cliente1@oscorp.com', password: 'client123' }
      }
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
