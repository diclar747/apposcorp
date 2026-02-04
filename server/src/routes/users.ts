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

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
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
    const { id } = req.params;
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

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id },
    });
    
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
