import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint definitivo para crear usuarios y verificar
router.get('/init', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const plainPassword = '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const results = [];

    // Crear/actualizar usuarios uno por uno con manejo de errores
    const usersToCreate = [
      {
        email: 'admin@oscorp.com',
        firstName: 'Administrador',
        lastName: 'Oscorp',
        role: 'superadmin',
        phone: '+1 234 567 8900'
      },
      {
        email: 'seller1@oscorp.com',
        firstName: 'Carlos',
        lastName: 'Vendedor',
        role: 'seller',
        phone: '+1 234 567 8901'
      },
      {
        email: 'client1@oscorp.com',
        firstName: 'João',
        lastName: 'Silva',
        role: 'client',
        phone: '+1 234 567 8903'
      }
    ];

    for (const userData of usersToCreate) {
      try {
        // Primero verificar si existe
        const existing = await prisma.user.findUnique({
          where: { email: userData.email },
          select: { id: true, email: true, password: true }
        });

        if (existing) {
          // Actualizar contraseña
          await prisma.user.update({
            where: { email: userData.email },
            data: { 
              password: hashedPassword,
              isActive: true
            }
          });
          
          // Verificar que la contraseña funciona
          const verify = await bcrypt.compare(plainPassword, hashedPassword);
          
          results.push({
            email: userData.email,
            action: 'updated',
            passwordHash: hashedPassword.substring(0, 30) + '...',
            hashVerified: verify
          });
        } else {
          // Crear nuevo usuario con wallet
          const newUser = await prisma.user.create({
            data: {
              email: userData.email,
              password: hashedPassword,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              address: 'Dirección de prueba',
              city: 'Ciudad de prueba',
              role: userData.role as any,
              isActive: true,
              wallet: {
                create: {
                  balance: 1000,
                  currency: 'USD'
                }
              }
            },
            include: { wallet: true }
          });

          // Crear tarjeta virtual
          if (newUser.wallet) {
            await prisma.virtualCard.create({
              data: {
                userId: newUser.id,
                walletId: newUser.wallet.id,
                cardNumber: `OSC${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                qrData: JSON.stringify({ userId: newUser.id }),
                design: 'gradient_blue'
              }
            });
          }

          results.push({
            email: userData.email,
            action: 'created',
            id: newUser.id
          });
        }
      } catch (userError: any) {
        results.push({
          email: userData.email,
          action: 'error',
          error: userError.message
        });
      }
    }

    // Verificar login para admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@oscorp.com' },
      select: { password: true, isActive: true }
    });

    let loginTest = null;
    if (adminUser) {
      const bcrypt2 = await import('bcryptjs');
      loginTest = await bcrypt2.compare(plainPassword, adminUser.password);
    }

    res.json({
      success: true,
      message: 'Usuarios inicializados',
      results,
      loginTest: {
        adminExists: !!adminUser,
        passwordMatch: loginTest,
        isActive: adminUser?.isActive
      },
      credentials: {
        email: 'admin@oscorp.com',
        password: '123456'
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Test directo de login
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.json({ exists: false, message: 'Usuario no encontrado' });
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);

    res.json({
      exists: true,
      passwordMatch: isValid,
      isActive: user.isActive,
      userId: user.id
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
