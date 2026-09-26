import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest, getOptionalUser } from '../middleware/auth.js';
import { generateProductSlug } from '../utils/slug.js';
import { planAllowsOnlineSales } from '../utils/plans.js';
import { getAffiliateConfig, getEffectiveRate, parseRateInput, parseTriState } from '../services/affiliateService.js';

const router = Router();

/** Costo, margen y proveedor son datos del negocio de la tienda: solo los ve su dueña o el superadmin. */
const hidePrivateFields = async (req: any, products: any[], viewer?: Awaited<ReturnType<typeof getOptionalUser>>) => {
  viewer = viewer !== undefined ? viewer : await getOptionalUser(req);
  const isSuperadmin = !!viewer?.roles.includes('superadmin');
  const ownSellerId = viewer && !isSuperadmin
    ? (await prisma.sellerProfile.findUnique({ where: { userId: viewer.userId }, select: { id: true } }))?.id ?? null
    : null;
  return products.map((p) => {
    if (isSuperadmin || p.sellerId === ownSellerId) return p;
    const { cost: _cost, profitPercentage: _profit, supplier: _supplier, supplierId: _supplierId, ...rest } = p;
    return rest;
  });
};

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, sellerId } = req.query;

    const where: any = {};
    const viewer = await getOptionalUser(req);
    const isSuperadmin = !!viewer?.roles.includes('superadmin');

    // Solo la tienda dueña (o un superadmin) ve sus productos inactivos; el resto ve solo los activos
    if (sellerId && sellerId !== 'undefined' && sellerId !== 'null') {
      where.sellerId = sellerId as string;
      const isOwner = isSuperadmin ||
        !!(viewer && await prisma.sellerProfile.findFirst({ where: { id: sellerId as string, userId: viewer.userId }, select: { id: true } }));
      if (!isOwner) where.status = 'active';
    } else {
      where.status = 'active';
    }

    if (category) {
      where.category = category as string;
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
            plan: true,
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

    res.json(await hidePrivateFields(req, products, viewer));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos', details: String(error) });
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

    res.json(await hidePrivateFields(req, products));
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Public product page by slug (or id). Solo productos activos, con datos públicos de la tienda
// y la comisión de afiliado si participa.
router.get('/public/:slug', async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: 'active' },
      include: {
        seller: {
          select: {
            id: true, userId: true, storeName: true, storeSlug: true, logo: true, whatsappNumber: true,
            isVerified: true, rating: true, reviewCount: true, address: true,
            affiliateEnabled: true, affiliateDefaultRate: true, affiliateAllProducts: true, affiliateBlocked: true,
            user: { select: { isActive: true } },
            plan: { select: { name: true, features: true } },
          },
        },
        variants: true,
        attributes: true,
      },
    });

    if (!product || !product.seller.user.isActive) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const [cfg, viewer] = await Promise.all([getAffiliateConfig(), getOptionalUser(req)]);
    const rate = getEffectiveRate(product.seller, product, cfg);

    const { cost: _cost, profitPercentage: _profit, supplierId: _supplier, ...publicProduct } = product;
    const { affiliateDefaultRate: _r, affiliateAllProducts: _a, affiliateBlocked: _b, user: _u, plan, ...seller } = product.seller;
    const onlineSales = planAllowsOnlineSales(plan) && product.visibility !== 'local';

    res.json({
      ...publicProduct,
      seller,
      onlineSales,
      affiliate: {
        participates: rate !== null,
        rate: rate !== null && (cfg.showRatePublic || viewer) ? rate : null,
      },
    });
  } catch (error) {
    console.error('Get public product error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    // Acepta id o slug: los enlaces del inicio usan el slug desde que todos los productos lo tienen
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        seller: {
          include: {
            store: true,
            plan: true,
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
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json((await hidePrivateFields(req, [product]))[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
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

    if (!user || (!user.roles.includes('seller') && !user.roles.includes('superadmin'))) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Determine sellerId (sellerProfile ID)
    let sellerId: string | undefined;
    if (user.roles.includes('seller')) {
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
      supplierId,
      affiliateEnabled,
      affiliateRate,
    } = req.body;

    let parsedAffiliateRate: number | null;
    try {
      parsedAffiliateRate = parseRateInput(affiliateRate, await getAffiliateConfig());
    } catch {
      const cfg = await getAffiliateConfig();
      return res.status(400).json({ error: `El % de afiliado debe estar entre ${cfg.minRate}% y ${cfg.maxRate}%` });
    }

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
      slug: await generateProductSlug(name),
      affiliateEnabled: parseTriState(affiliateEnabled),
      affiliateRate: parsedAffiliateRate,
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
    res.status(500).json({ error: 'Error del servidor' });
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
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Only seller owner or admin can update
    if (!req.user!.roles.includes('superadmin') && product.seller.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const {
      name, description, price, cost, profitPercentage, comparePrice,
      stock, sku, category, subcategory, images, type, visibility,
      status, weight, dimensions, tags, isFeatured, supplierId,
      affiliateEnabled, affiliateRate, affiliateBlocked,
    } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (cost !== undefined) updateData.cost = parseFloat(cost) || 0;
    if (profitPercentage !== undefined) updateData.profitPercentage = parseFloat(profitPercentage) || 0;
    if (comparePrice !== undefined) updateData.comparePrice = parseFloat(comparePrice);
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    if (sku !== undefined) updateData.sku = sku;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (type !== undefined) updateData.type = type;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (status !== undefined) updateData.status = status;
    if (weight !== undefined) updateData.weight = weight;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (tags !== undefined) updateData.tags = tags;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (supplierId !== undefined) updateData.supplierId = supplierId || null;
    if (affiliateEnabled !== undefined) updateData.affiliateEnabled = parseTriState(affiliateEnabled);
    if (affiliateRate !== undefined) {
      const cfg = await getAffiliateConfig();
      try {
        updateData.affiliateRate = parseRateInput(affiliateRate, cfg);
      } catch {
        return res.status(400).json({ error: `El % de afiliado debe estar entre ${cfg.minRate}% y ${cfg.maxRate}%` });
      }
    }
    // Solo el superadmin puede apagar afiliados en un producto
    if (affiliateBlocked !== undefined && req.user!.roles.includes('superadmin')) updateData.affiliateBlocked = !!affiliateBlocked;
    if (!product.slug) updateData.slug = await generateProductSlug(updateData.name ?? product.name);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
        attributes: true,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
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
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!req.user!.roles.includes('superadmin') && product.seller.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Un producto con ventas no se puede borrar (los pedidos lo referencian): se desactiva
    const hasSales = await prisma.orderItem.count({ where: { productId: id } });
    if (hasSales > 0) {
      await prisma.product.update({ where: { id }, data: { status: 'inactive' } });
      return res.json({ message: 'El producto tiene ventas, así que se desactivó en lugar de eliminarse', deactivated: true });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
