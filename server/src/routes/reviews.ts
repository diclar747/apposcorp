import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /reviews/store/:id - Get reviews for a store
router.get('/store/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Resolve storeId (could be sellerProfileId or storeId)
    let storeId = id;
    const storeRecord = await prisma.store.findUnique({
      where: { id: id }
    });

    if (!storeRecord) {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id: id },
        include: { store: true }
      });
      if (sellerProfile?.store) {
        storeId = sellerProfile.store.id;
      }
    }

    const reviews = await prisma.review.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// POST /reviews - Create a new review
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { storeId, productId, rating, comment } = req.body;
    console.log('Incoming review attempt:', { userId, storeId, productId, rating });

    if (!rating || (!storeId && !productId)) {
      return res.status(400).json({ error: 'Faltan datos requeridos (calificación y storeId/productId)' });
    }

    let resolvedStoreId = storeId;
    let sellerId: string | null = null;

    if (storeId) {
      // 1. Verificar si storeId es realmente un ID de la tabla Store
      const storeRecord = await prisma.store.findUnique({
        where: { id: storeId }
      });

      if (storeRecord) {
        resolvedStoreId = storeRecord.id;
        sellerId = storeRecord.sellerId;
      } else {
        // 2. Si no es un Store ID, podría ser un SellerProfile ID
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { id: storeId },
          include: { store: true }
        });

        if (sellerProfile) {
          sellerId = sellerProfile.id;
          if (sellerProfile.store) {
            resolvedStoreId = sellerProfile.store.id;
          } else {
            // 3. Si el vendedor no tiene registro en la tabla Store, lo creamos para mantener la integridad
            const newStore = await prisma.store.create({
              data: {
                sellerId: sellerProfile.id,
                name: sellerProfile.storeName,
                slug: sellerProfile.storeSlug,
                description: sellerProfile.description,
                address: sellerProfile.address,
                phone: sellerProfile.phone,
                email: sellerProfile.email,
                whatsappNumber: sellerProfile.whatsappNumber
              }
            });
            resolvedStoreId = newStore.id;
          }
        } else {
          return res.status(404).json({ error: 'Tienda/Vendedor no encontrado' });
        }
      }
    }

    const review = await prisma.review.create({
      data: {
        userId,
        storeId: resolvedStoreId,
        productId,
        rating: Number(rating),
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Update store average rating if applicable
    if (sellerId && resolvedStoreId) {
      const allStoreReviews = await prisma.review.findMany({
        where: { storeId: resolvedStoreId },
        select: { rating: true }
      });

      const avgRating = allStoreReviews.reduce((acc, r) => acc + r.rating, 0) / allStoreReviews.length;

      await prisma.sellerProfile.update({
        where: { id: sellerId },
        data: {
          rating: avgRating,
          reviewCount: allStoreReviews.length
        }
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error detail:', error);
    res.status(500).json({ 
      error: 'Error al crear la reseña',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
