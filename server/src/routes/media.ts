import { Router, Response } from 'express';
import { prisma } from '../utils/prisma.js';

// Sirve como archivo las imágenes guardadas en base64 (data:image/...;base64,...) para que puedan usarse
// donde no se aceptan data URIs, como la vista previa de WhatsApp/Facebook. Si la imagen es una URL, redirige.
const router = Router();

const sendImage = (res: Response, src: string | null | undefined) => {
  if (!src) return res.status(404).json({ error: 'Imagen no encontrada' });
  if (/^https?:\/\//i.test(src) || src.startsWith('/')) return res.redirect(302, src);
  const match = src.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
  if (!match) return res.status(404).json({ error: 'Imagen no encontrada' });
  res.setHeader('Content-Type', match[1].toLowerCase());
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(Buffer.from(match[2], 'base64'));
};

router.get('/product/:slug/:index', async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const index = Math.max(0, Number(req.params.index) || 0);
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: 'active' },
      select: { images: true },
    });
    sendImage(res, product?.images[index]);
  } catch (error) {
    console.error('media product error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/store/:slug/:kind', async (req, res) => {
  try {
    const kind = req.params.kind === 'banner' ? 'banner' : 'logo';
    const store = await prisma.sellerProfile.findUnique({
      where: { storeSlug: req.params.slug as string },
      select: { logo: true, banner: true },
    });
    sendImage(res, store?.[kind]);
  } catch (error) {
    console.error('media store error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
