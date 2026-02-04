import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, sellerId } = req.query;
    
    const where: any = { status: 'active' };
    
    if (category) {
      where.category = category as string;
    }
    
    if (sellerId) {
      where.sellerId = sellerId as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        variants: true,
        attributes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get featured products (public)
router.get('/featured', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        isFeatured: true,
      },
      include: {
        seller: true,
      },
      take: 10,
    });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            store: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        variants: true,
        attributes: true,
      },
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Create product (seller or admin)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { sellerProfile: true },
    });
    
    if (!user || (user.role !== 'seller' && user.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const sellerId = user.role === 'seller' 
      ? user.sellerProfile?.id 
      : req.body.sellerId;
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID é obrigatório' });
    }
    
    const product = await prisma.product.create({
      data: {
        ...req.body,
        sellerId,
        sku: `SKU-${Date.now()}`,
      },
      include: {
        variants: true,
        attributes: true,
      },
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update product
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Only seller owner or admin can update
    if (req.user!.role !== 'superadmin' && product.seller.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        variants: true,
        attributes: true,
      },
    });
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    if (req.user!.role !== 'superadmin' && product.seller.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await prisma.product.delete({
      where: { id },
    });
    
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
