import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, phone, city, avatar } = req.body;
    
    // Si viene 'name', procesamos el firstname y lastname
    const dataToUpdate: any = { phone, city, avatar };
    if (name) {
      const nameParts = name.trim().split(' ');
      dataToUpdate.firstName = nameParts[0];
      if (nameParts.length > 1) {
        dataToUpdate.lastName = nameParts.slice(1).join(' ');
      } else {
        dataToUpdate.lastName = '';
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: dataToUpdate,
    });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// Get all users (admin only)
router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        sellerProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithoutPassword = users.map(({ password: _password, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Search users by email, phone or name (for transfers)
router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { query } = req.query;

    if (!query || (query as string).length < 3) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user!.userId },
        isActive: true,
        OR: [
          { email: { contains: query as string, mode: 'insensitive' } },
          { firstName: { contains: query as string, mode: 'insensitive' } },
          { lastName: { contains: query as string, mode: 'insensitive' } },
          { phone: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        phone: true,
      },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Update seller profile (seller only) - creates profile if it doesn't exist
router.put('/seller-profile', authenticate, authorize('seller'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const {
      storeName,
      storeSlug,
      description,
      address,
      phone,
      whatsappNumber,
      email,
      logo,
      banner,
      socialLinks
    } = req.body;

    // Check if profile exists
    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });

    // Validate storeSlug if provided
    if (storeSlug && (!existingProfile || storeSlug !== existingProfile.storeSlug)) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(storeSlug)) {
        return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' });
      }
      const existing = await prisma.sellerProfile.findUnique({ where: { storeSlug } });
      if (existing && existing.userId !== userId) {
        return res.status(400).json({ error: 'Este slug ya está en uso por otra tienda' });
      }
    }

    // Use upsert to create profile if it doesn't exist
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });

    const updateData: any = {
      storeName,
      description,
      address,
      phone,
      whatsappNumber,
      email,
      logo,
      banner,
      socialLinks: socialLinks || existingProfile?.socialLinks || {},
    };

    if (storeSlug && (!existingProfile || storeSlug !== existingProfile.storeSlug)) {
      updateData.storeSlug = storeSlug;
    }

    const updatedProfile = await prisma.sellerProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        storeName: storeName || `${user?.firstName || 'Mi'} Store`,
        storeSlug: storeSlug || `store-${Date.now()}`,
        description: description || '',
        address: address || '',
        phone: phone || '',
        email: email || user?.email || '',
        whatsappNumber: whatsappNumber || '',
        logo: logo || '',
        banner: banner || '',
        socialLinks: socialLinks || {},
        planActive: true,
        planExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar perfil de vendedor' });
  }
});

// Update seller profile by ID (admin only)
router.put('/:id/seller-profile', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id as string;
    const {
      storeName,
      description,
      address,
      phone,
      whatsappNumber,
      email,
      logo,
      banner,
      socialLinks
    } = req.body;

    // Check if user exists and is a seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sellerProfile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!user.roles.includes('seller')) {
      return res.status(400).json({ error: 'Usuário não é um vendedor' });
    }

    // Upsert profile
    const updatedProfile = await prisma.sellerProfile.upsert({
      where: { userId },
      update: {
        storeName,
        description,
        address,
        phone,
        whatsappNumber,
        email,
        logo,
        banner,
        socialLinks: socialLinks || user.sellerProfile?.socialLinks,
      },
      create: {
        userId,
        storeName: storeName || `${user.firstName}'s Store`,
        storeSlug: `store-${Date.now()}`,
        description: description || '',
        address: address || '',
        phone: phone || '',
        email: email || user.email,
        whatsappNumber: whatsappNumber || '',
        logo: logo || '',
        banner: banner || '',
        socialLinks: socialLinks || {},
        planActive: true,
        planExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor ao actualizar perfil' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    // Only admin or own user can view
    if (!req.user!.roles.includes('superadmin') && req.user!.userId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: {
          include: {
            products: true,
          },
        },
        bankData: true,
        userCourses: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { firstName, lastName, email, phone, roles, password } = req.body;

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      roles,
    };

    if (password) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Ensure wallet and virtual card if 'client' role is added and doesn't exist
    const oldUser = await prisma.user.findUnique({
      where: { id },
      include: { wallet: true }
    });

    if (roles?.includes('client') && oldUser && !oldUser.wallet) {
      updateData.wallet = { create: { balance: 0, currency: 'USD' } };
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { wallet: true, virtualCard: true }
    });

    // Create virtual card if we just created a wallet
    if (roles?.includes('client') && oldUser && !oldUser.wallet && user.wallet) {
      const crypto = await import('crypto');
      const cardNumber = `OSC${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      await prisma.virtualCard.create({
        data: {
          userId: user.id,
          walletId: user.wallet.id,
          cardNumber,
          qrData: JSON.stringify({ userId: user.id, cardNumber }),
          design: 'gradient_blue',
        },
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const id = req.params.id as string;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update Ingenio Access (admin only)
router.patch('/:id/ingenio', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { hasAccess } = req.body;

    // Get default price for subscription record if creating one
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'ingenio_price' } });
    const defaultPrice = Number(setting?.value || 700000);

    await prisma.$transaction(async (tx) => {
      // 1. Get current user data
      const oldUser = await tx.user.findUnique({ where: { id }, select: { roles: true } });
      if (!oldUser) return;

      const roles = Array.isArray(oldUser.roles) ? [...oldUser.roles] : [];
      if (hasAccess && !roles.includes('ingenio')) {
        roles.push('ingenio');
      }

      // 2. Update User flag and roles
      await tx.user.update({
        where: { id },
        data: { 
          ingenioAccess: hasAccess,
          roles: roles
        },
      });

      // 3. Synchronize Subscription table
      if (hasAccess) {
        // Find existing sub
        const existingSub = await tx.ingenioSubscription.findUnique({ where: { userId: id } });
        
        if (existingSub) {
          await tx.ingenioSubscription.update({
            where: { userId: id },
            data: { 
              status: 'ACTIVE',
              updatedAt: new Date(),
              approvedAt: existingSub.approvedAt || new Date()
            }
          });
        } else {
          // Create a "Complimentary" active subscription
          await tx.ingenioSubscription.create({
            data: {
              userId: id,
              status: 'ACTIVE',
              totalAmount: defaultPrice,
              paidAmount: defaultPrice, // Give full credit if manually activated by admin
              installments: 1,
              paymentMethod: 'ADMIN_MANUAL',
              approvedAt: new Date()
            }
          });
        }

        // 4. Create Student profile if missing
        const existingStudent = await tx.ingenioStudent.findUnique({ where: { userId: id } });
        if (!existingStudent) {
          await tx.ingenioStudent.create({
            data: {
              userId: id,
              referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
              isActive: true,
              joinedAt: new Date()
            }
          });
        }
      } else {
        // CLEAN RESET: If deactivating, delete the subscription and student profile
        // This ensures the user sees the system as if they never had access (landing/pricing)
        // We KEEP the 'ingenio' role as requested, only the access flag and records are removed.
        await tx.ingenioSubscription.deleteMany({ where: { userId: id } });
        await tx.ingenioStudent.deleteMany({ where: { userId: id } });
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update Ingenio Access error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update Bank Data
router.put('/me/bank-data', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { bankName, accountNumber, accountType, holderName, documentId } = req.body;

    if (!bankName || !accountNumber || !holderName || !documentId) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const bankData = await prisma.bankData.upsert({
      where: { userId },
      update: {
        bankName,
        accountNumber,
        accountType: accountType || 'savings',
        holderName,
        documentId
      },
      create: {
        userId,
        bankName,
        accountNumber,
        accountType: accountType || 'savings',
        holderName,
        documentId
      }
    });

    res.json(bankData);
  } catch (error) {
    console.error('Update bank data error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get notification preferences
router.get('/me/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { notificationPrefs: true },
    });

    const defaults = {
      pushNotifications: true,
      emailNotifications: true,
      orderAlerts: true,
      lowStockAlerts: true,
      promotionAlerts: false,
      securityAlerts: true,
      newReviewAlerts: true,
      weeklyReport: false,
    };

    const prefs = user?.notificationPrefs
      ? { ...defaults, ...(user.notificationPrefs as object) }
      : defaults;

    res.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Update notification preferences
router.put('/me/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const prefs = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { notificationPrefs: prefs },
      select: { notificationPrefs: true },
    });

    res.json(user.notificationPrefs);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Assign course to user (admin only)
router.post('/:id/courses/:courseId', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id as string;
    const courseId = req.params.courseId as string;

    const userCourse = await prisma.userCourse.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        status: 'active',
      },
      create: {
        userId,
        courseId,
        status: 'active',
      },
    });

    res.json(userCourse);
  } catch (error) {
    console.error('Assign course error:', error);
    res.status(500).json({ error: 'Error al asignar curso' });
  }
});

// Remove course from user (admin only)
router.delete('/:id/courses/:courseId', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id as string;
    const courseId = req.params.courseId as string;

    await prisma.userCourse.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    res.json({ message: 'Acceso al curso eliminado' });
  } catch (error) {
    console.error('Remove course error:', error);
    res.status(500).json({ error: 'Error al revocar acceso' });
  }
});

// Upgrade user to client role (adds 'client' role and creates wallet)
router.post('/upgrade-to-client', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const roles = Array.isArray(user.roles) ? [...user.roles] : [];
    if (!roles.includes('client')) {
      roles.push('client');
    }

    // Update user and create wallet if doesn't exist
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles,
        ...( !user.wallet ? {
          wallet: {
            create: {
              balance: 0,
              currency: 'USD'
            }
          }
        } : {})
      },
      include: { wallet: true }
    });

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Upgrade to client error:', error);
    res.status(500).json({ error: 'Error al actualizar a cliente' });
  }
});

export default router;
