import { Router } from 'express';
import { prisma } from '../utils/prisma.js';

const router = Router();

// GET / - List all active stores (public)
router.get('/', async (_req, res) => {
  try {
    const stores = await prisma.sellerProfile.findMany({
      where: {
        storeName: { not: '' },
        user: { isActive: true },
      },
      include: {
        products: {
          where: { status: 'active' },
          select: { id: true, name: true, price: true, images: true, category: true },
          take: 4,
        },
        user: {
          select: { firstName: true, lastName: true, avatar: true, isActive: true }
        },
        store: {
          select: { category: true, isActive: true, isOnline: true }
        }
      },
      orderBy: { totalSales: 'desc' },
    });

    // Derive category from most common product category if no Store record
    const deriveCategory = (s: any): string => {
      if (s.store?.category && s.store.category !== 'General') return s.store.category;
      if (s.products && s.products.length > 0) {
        return s.products[0].category || 'General';
      }
      return 'General';
    };

    // Map to a clean store format
    const storeList = stores.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.storeName,
      slug: s.storeSlug,
      description: s.description,
      logo: s.logo,
      banner: s.banner,
      address: s.address,
      phone: s.phone,
      email: s.email,
      whatsappNumber: s.whatsappNumber,
      isActive: s.store?.isActive ?? true,
      isOnline: s.store?.isOnline ?? true,
      isVerified: s.isVerified,
      rating: s.rating,
      reviewCount: s.reviewCount,
      totalSales: s.totalSales,
      productCount: s.products.length,
      products: s.products,
      category: deriveCategory(s),
      socialLinks: s.socialLinks,
      businessHours: s.businessHours,
      owner: {
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        avatar: s.user.avatar,
      },
    }));

    res.json(storeList);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
});

// GET /:slug - Get store by slug with all products (public)
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug as string;

    const store = await prisma.sellerProfile.findUnique({
      where: { storeSlug: slug },
      include: {
        products: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { firstName: true, lastName: true, avatar: true, isActive: true }
        },
        store: {
          select: { category: true, isActive: true, isOnline: true }
        },
        plan: true
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const storeData = {
      id: store.id,
      userId: store.userId,
      name: store.storeName,
      slug: store.storeSlug,
      description: store.description,
      logo: store.logo,
      banner: store.banner,
      address: store.address,
      phone: store.phone,
      email: store.email,
      whatsappNumber: store.whatsappNumber,
      isActive: store.store?.isActive ?? true,
      isOnline: store.store?.isOnline ?? true,
      isVerified: store.isVerified,
      rating: store.rating,
      reviewCount: store.reviewCount,
      totalSales: store.totalSales,
      category: store.store?.category || 'General',
      businessHours: store.businessHours,
      socialLinks: store.socialLinks,
      products: store.products,
      owner: {
        firstName: store.user.firstName,
        lastName: store.user.lastName,
        avatar: store.user.avatar,
      },
      plan: store.plan
    };

    res.json(storeData);
  } catch (error) {
    console.error('Get store by slug error:', error);
    res.status(500).json({ error: 'Error al obtener tienda' });
  }
});

export default router;
