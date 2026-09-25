import type { Request } from 'express';
import { prisma } from '../utils/prisma.js';

// Vista previa (Open Graph) para WhatsApp/Facebook: esos bots no ejecutan JS, así que las metaetiquetas
// de la página de producto y de tienda se inyectan en el index.html que sirve el servidor.

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatGs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`;

const baseUrl = (req: Request) =>
  (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

/** URL pública de una imagen. Las guardadas en base64 se sirven por /api/media (los bots no leen data URIs). */
const absolute = (url: string | null | undefined, base: string, mediaPath: string) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('data:')) return `${base}/api/media/${mediaPath}`;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Preview {
  title: string;
  description: string;
  image: string | null;
  url: string;
  type: string;
}

const getPreview = async (req: Request): Promise<Preview | null> => {
  const base = baseUrl(req);
  // Se conserva ?ref=: Facebook usa og:url como enlace canónico y sin él se perdería el afiliado
  const ref = typeof req.query.ref === 'string' && /^[A-Za-z0-9]{4,16}$/.test(req.query.ref) ? `?ref=${req.query.ref}` : '';
  const [, kind, rawSlug] = req.path.split('/');
  const slug = decodeURIComponent(rawSlug || '');
  if (!slug) return null;

  if (kind === 'producto') {
    const p = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: 'active' },
      include: { seller: { select: { storeName: true, logo: true, storeSlug: true } } },
    });
    if (!p) return null;
    return {
      title: `${p.name} - ${formatGs(p.price)}`,
      description: `${p.description || ''}`.slice(0, 180) || `Compralo en ${p.seller.storeName} por OSCORP`,
      image: absolute(p.images[0], base, `product/${encodeURIComponent(p.slug || p.id)}/0`)
        || absolute(p.seller.logo, base, `store/${encodeURIComponent(p.seller.storeSlug)}/logo`),
      url: `${base}/producto/${p.slug || p.id}${ref}`,
      type: 'product',
    };
  }

  if (kind === 'tienda') {
    const s = await prisma.sellerProfile.findUnique({ where: { storeSlug: slug } });
    if (!s) return null;
    return {
      title: `${s.storeName} | OSCORP`,
      description: (s.description || `Conocé los productos de ${s.storeName}`).slice(0, 180),
      image: absolute(s.banner, base, `store/${encodeURIComponent(s.storeSlug)}/banner`)
        || absolute(s.logo, base, `store/${encodeURIComponent(s.storeSlug)}/logo`),
      url: `${base}/tienda/${s.storeSlug}${ref}`,
      type: 'website',
    };
  }
  return null;
};

/** Devuelve el index.html con las metaetiquetas de la página, o null si no aplica. */
export const renderSharePreview = async (req: Request, indexHtml: string): Promise<string | null> => {
  const preview = await getPreview(req).catch(() => null);
  if (!preview) return null;

  const tags = [
    `<meta property="og:site_name" content="OSCORP" />`,
    `<meta property="og:type" content="${preview.type}" />`,
    `<meta property="og:title" content="${escapeHtml(preview.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(preview.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(preview.url)}" />`,
    preview.image ? `<meta property="og:image" content="${escapeHtml(preview.image)}" />` : '',
    `<meta name="twitter:card" content="${preview.image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="description" content="${escapeHtml(preview.description)}" />`,
  ].filter(Boolean).join('\n    ');

  return indexHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(preview.title)}</title>`)
    .replace('</head>', `    ${tags}\n  </head>`);
};
