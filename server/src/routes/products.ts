import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

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
        supplier: true,
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
    const id = req.params.id as string;

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

    // Determine sellerId (sellerProfile ID)
    let sellerId: string | undefined;
    if (user.role === 'seller') {
      sellerId = user.sellerProfile?.id;
    } else {
      // Admin passes userId, we need to find the sellerProfile
      const targetUserId = req.body.sellerId;
      if (targetUserId) {
        const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: targetUserId } });
        sellerId = sellerProfile?.id;
      }
    }

    if (!sellerId) {
      return res.status(400).json({ error: 'Vendedor no encontrado o no tiene perfil de vendedor' });
    }

    // Extract and sanitize data
    const {
      name,
      description,
      price,
      cost,
      profitPercentage,
      comparePrice,
      stock,
      sku,
      category,
      images,
      type,
      visibility,
      status,
      variants,
      attributes,
      supplierId
    } = req.body;

    // Validate SKU uniqueness
    const finalSku = sku || `SKU-${Date.now()}`;
    const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      return res.status(400).json({ error: `El SKU "${finalSku}" ya existe. Usa uno diferente.` });
    }

    // Prepare Prisma data object
    const productData: any = {
      sellerId,
      name,
      description,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      profitPercentage: parseFloat(profitPercentage) || 0,
      stock: parseInt(stock) || 0,
      sku: finalSku,
      category,
      type,
      visibility,
      status: status || 'active',
      images: Array.isArray(images) ? images : [],
      supplierId: supplierId || null,
    };

    // Add optional fields if they exist
    if (comparePrice !== undefined) productData.comparePrice = parseFloat(comparePrice);

    // Handle relations
    if (Array.isArray(attributes) && attributes.length > 0) {
      productData.attributes = {
        create: attributes.map((attr: any) => ({
          name: attr.name,
          value: attr.value
        }))
      };
    }

    if (Array.isArray(variants) && variants.length > 0) {
      productData.variants = {
        create: variants.map((variant: any) => ({
          name: variant.name,
          price: parseFloat(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
          sku: variant.sku
        }))
      };
    }

    const product = await prisma.product.create({
      data: productData,
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
    const id = req.params.id as string;

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
    const id = req.params.id as string;

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
