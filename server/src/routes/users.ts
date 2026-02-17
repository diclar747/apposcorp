import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

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

    if (user.role !== 'seller') {
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
    res.status(500).json({ error: 'Erro no servidor ao atualizar perfil' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    // Only admin or own user can view
    if (req.user!.role !== 'superadmin' && req.user!.userId !== id) {
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
    const { firstName, lastName, email, phone, role, password } = req.body;

    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      role,
    };

    if (password) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

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

    const user = await prisma.user.update({
      where: { id },
      data: { ingenioAccess: hasAccess },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
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

export default router;
