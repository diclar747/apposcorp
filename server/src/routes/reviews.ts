import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /reviews/store/:id - Get reviews for a store
router.get('/store/:id', async (req, res) => {
  try {
    const storeId = req.params.id;
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

    if (!rating || (!storeId && !productId)) {
      return res.status(400).json({ error: 'Faltan datos requeridos (calificación y storeId/productId)' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        storeId,
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
    if (storeId) {
      const allStoreReviews = await prisma.review.findMany({
        where: { storeId },
        select: { rating: true }
      });

      const avgRating = allStoreReviews.reduce((acc, r) => acc + r.rating, 0) / allStoreReviews.length;

      await prisma.sellerProfile.update({
        where: { id: storeId },
        data: {
          rating: avgRating,
          reviewCount: allStoreReviews.length
        }
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Error al crear la reseña' });
  }
});

export default router;
