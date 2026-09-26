import crypto from 'crypto';
import { prisma } from './prisma.js';

export const slugify = (text: string) =>
  (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const isValidSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;

/** Slug legible y único para un producto: "nombre-del-producto-a1b2c3". */
export const generateProductSlug = async (name: string) => {
  const base = slugify(name) || 'producto';
  for (let i = 0; i < 5; i++) {
    const slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
    const taken = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

/**
 * Slug legible para una tienda: "mi-tienda", o "mi-tienda-2", "mi-tienda-3"... si ya está en uso.
 * A diferencia del de producto, no lleva sufijo al azar: es el enlace que la tienda va a compartir.
 */
export const generateStoreSlug = async (name: string) => {
  const base = slugify(name) || 'tienda';
  for (let i = 1; i <= 200; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const taken = await prisma.sellerProfile.findUnique({ where: { storeSlug: slug }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
};

/** Completa el slug de los productos que no tienen (los creados antes de esta versión). */
export const backfillProductSlugs = async () => {
  const missing = await prisma.product.findMany({ where: { slug: null }, select: { id: true, name: true } });
  for (const p of missing) {
    await prisma.product.update({ where: { id: p.id }, data: { slug: await generateProductSlug(p.name) } });
  }
  if (missing.length) console.log(`🔗 Slugs generados para ${missing.length} productos`);
};

/** Reemplaza los slugs feos "store-<número>" (tiendas creadas antes de esta versión) por uno legible. */
export const backfillStoreSlugs = async () => {
  const ugly = await prisma.sellerProfile.findMany({
    where: { storeSlug: { startsWith: 'store-' } },
    select: { id: true, storeName: true, storeSlug: true },
  });
  const toFix = ugly.filter((s) => /^store-[a-z0-9]+$/i.test(s.storeSlug));
  for (const s of toFix) {
    await prisma.sellerProfile.update({ where: { id: s.id }, data: { storeSlug: await generateStoreSlug(s.storeName) } });
  }
  if (toFix.length) console.log(`🔗 Enlaces de tienda generados para ${toFix.length} tienda(s)`);
};
