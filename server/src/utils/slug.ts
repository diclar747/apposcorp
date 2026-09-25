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

/** Completa el slug de los productos que no tienen (los creados antes de esta versión). */
export const backfillProductSlugs = async () => {
  const missing = await prisma.product.findMany({ where: { slug: null }, select: { id: true, name: true } });
  for (const p of missing) {
    await prisma.product.update({ where: { id: p.id }, data: { slug: await generateProductSlug(p.name) } });
  }
  if (missing.length) console.log(`🔗 Slugs generados para ${missing.length} productos`);
};
