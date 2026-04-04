import { Router } from 'express';
import { prisma } from '../utils/prisma.js';

const router = Router();

// Debug endpoint - verificar estado del login
router.get('/login-check', async (req, res) => {
  try {
    const { email = 'admin@oscorp.com', password = '123456' } = req.query;
    
    // 1. Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: email as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        password: true, // Incluir password para debug
        createdAt: true,
      }
    });

    if (!user) {
      return res.json({
        exists: false,
        message: 'Usuario no encontrado en la base de datos',
        email: email
      });
    }

    // 2. Verificar contraseña
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password as string, user.password);

    // 3. Contar todos los usuarios
    const totalUsers = await prisma.user.count();

    res.json({
      exists: true,
      isActive: user.isActive,
      passwordMatch: isValid,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        passwordHash: user.password.substring(0, 20) + '...' // Solo mostrar inicio del hash
      },
      totalUsers: totalUsers,
      testPassword: password,
      message: isValid ? 'Login funcionaría correctamente' : 'La contraseña no coincide'
    });

  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Crear usuario de emergencia si no existe
router.get('/create-emergency-user', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Forzar creación de admin
    const user = await prisma.user.upsert({
      where: { email: 'admin@oscorp.com' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        email: 'admin@oscorp.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Oscorp',
        phone: '0000000000',
        address: 'Admin Address',
        city: 'Admin City',
        role: 'superadmin',
        isActive: true,
        wallet: {
          create: {
            balance: 0,
            currency: 'USD'
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Usuario admin creado/actualizado',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      credentials: {
        email: 'admin@oscorp.com',
        password: '123456'
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
