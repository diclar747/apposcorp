import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { getOptionalUser } from '../middleware/auth.js';

// Las imágenes llegan del navegador como data URI (base64). Guardarlas así en cada campo hacía que
// los listados pesaran decenas de MB (cada producto repetía sus fotos y el logo y banner de su tienda).
// Ahora el contenido va una sola vez a media_files y el campo guarda /api/media/f/<hash>.<ext>.

const DATA_URI = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

export const MEDIA_PREFIX = '/api/media/f/';

export const isImageDataUri = (value: unknown): value is string => typeof value === 'string' && value.startsWith('data:image/');

/** Guarda una imagen data URI y devuelve su URL. Cualquier otro valor se devuelve igual. */
export const storeImage = async (value: string): Promise<string> => {
  const match = value.match(DATA_URI);
  if (!match) return value;
  const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > MAX_IMAGE_BYTES) return value;

  const id = crypto.createHash('sha256').update(data).digest('hex').slice(0, 40);
  await prisma.mediaFile.upsert({
    where: { id },
    update: {},
    create: { id, mimeType, size: data.length, data },
  });
  return `${MEDIA_PREFIX}${id}.${EXT[mimeType] || 'img'}`;
};

/** Recorre un objeto/array y reemplaza cada imagen data URI por su URL. */
export const externalizeImages = async <T>(value: T): Promise<T> => {
  if (isImageDataUri(value)) return (await storeImage(value)) as T;
  if (Array.isArray(value)) return (await Promise.all(value.map((v) => externalizeImages(v)))) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await externalizeImages(v);
    return out as T;
  }
  return value;
};

/**
 * Middleware: las imágenes del cuerpo del pedido se guardan en media_files antes de llegar a la ruta.
 * Solo con sesión válida (sin ella la ruta responde 401 y no se guarda nada).
 */
export const externalizeBodyImages = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body !== 'object' || !['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  try {
    if (!(await getOptionalUser(req))) return next();
    req.body = await externalizeImages(req.body);
    next();
  } catch (error) {
    console.error('[imágenes] no se pudo guardar la imagen:', error);
    res.status(500).json({ error: 'No se pudo guardar la imagen' });
  }
};

/** Sirve /api/media/f/<id>.<ext>. El contenido nunca cambia para un id, así que se cachea para siempre. */
export const serveMediaFile = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.file || '').replace(/\.[a-z]+$/i, '');
    if (!/^[a-f0-9]{16,64}$/.test(id)) return res.status(404).json({ error: 'Imagen no encontrada' });
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) return res.status(404).json({ error: 'Imagen no encontrada' });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(file.data));
  } catch (error) {
    console.error('media file error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * Migra las imágenes guardadas en base64 antes de esta versión. Idempotente: solo toca filas que todavía
 * tienen data URIs, y cada fila se actualiza recién después de guardar sus imágenes en media_files.
 */
export const migrateInlineImages = async () => {
  let rows = 0;
  const batch = 20;

  // Productos (images es un arreglo)
  for (;;) {
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM products WHERE EXISTS (SELECT 1 FROM unnest(images) AS img WHERE img LIKE 'data:image/%') LIMIT ${batch}`;
    if (ids.length === 0) break;
    let changed = 0;
    for (const { id } of ids) {
      const p = await prisma.product.findUnique({ where: { id }, select: { images: true } });
      if (!p) continue;
      const images = await Promise.all(p.images.map((img) => storeImage(img)));
      if (images.some((img, i) => img !== p.images[i])) changed++;
      await prisma.product.update({ where: { id }, data: { images } });
      rows++;
    }
    if (changed === 0) break; // quedan imágenes que no se pueden convertir (formato raro): no reintentar
  }

  const migrateField = async (
    label: string,
    find: () => Promise<{ id: string; value: string | null }[]>,
    save: (id: string, value: string) => Promise<unknown>,
  ) => {
    for (;;) {
      const list = await find();
      if (list.length === 0) return;
      let changed = 0;
      for (const r of list) {
        if (!r.value) continue;
        const url = await storeImage(r.value);
        if (url === r.value) continue;
        await save(r.id, url);
        changed++;
        rows++;
      }
      if (changed === 0) {
        console.warn(`[imágenes] ${label}: ${list.length} imagen(es) sin convertir`);
        return;
      }
    }
  };

  const dataUri = { startsWith: 'data:image/' };
  await migrateField(
    'logos de tiendas',
    async () => (await prisma.sellerProfile.findMany({ where: { logo: dataUri }, select: { id: true, logo: true }, take: batch })).map((s) => ({ id: s.id, value: s.logo })),
    (id, logo) => prisma.sellerProfile.update({ where: { id }, data: { logo } }),
  );
  await migrateField(
    'banners de tiendas',
    async () => (await prisma.sellerProfile.findMany({ where: { banner: dataUri }, select: { id: true, banner: true }, take: batch })).map((s) => ({ id: s.id, value: s.banner })),
    (id, banner) => prisma.sellerProfile.update({ where: { id }, data: { banner } }),
  );
  await migrateField(
    'avatares',
    async () => (await prisma.user.findMany({ where: { avatar: dataUri }, select: { id: true, avatar: true }, take: batch })).map((u) => ({ id: u.id, value: u.avatar })),
    (id, avatar) => prisma.user.update({ where: { id }, data: { avatar } }),
  );
  await migrateField(
    'imágenes de pedidos',
    async () => (await prisma.orderItem.findMany({ where: { productImage: dataUri }, select: { id: true, productImage: true }, take: batch })).map((o) => ({ id: o.id, value: o.productImage })),
    (id, productImage) => prisma.orderItem.update({ where: { id }, data: { productImage } }),
  );

  if (rows) console.log(`🖼️  Imágenes migradas a media_files: ${rows} registro(s)`);
  return rows;
};
