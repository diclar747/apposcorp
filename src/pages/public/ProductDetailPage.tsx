import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Share2, ShoppingBag, Store, CheckCircle2, MessageCircle, Plus, Minus, Package, Loader2, ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api';
import { trackReferral } from '@/lib/affiliate';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores';
import { PromoteButton, AffiliateBadge } from '@/components/affiliate/PromoteButton';

interface PublicProduct {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  images: string[];
  category: string;
  type: string;
  sku: string;
  sellerId: string;
  onlineSales: boolean;
  seller: {
    id: string;
    storeName: string;
    storeSlug: string;
    logo: string | null;
    whatsappNumber: string;
    isVerified: boolean;
  };
  affiliate: { participates: boolean; rate: number | null };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('from') === 'vendedor';
  const { isAuthenticated } = useAuthStore();
  const { addItem, items } = useCartStore();

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    productsApi
      .getPublic(slug)
      .then((data) => { if (!cancelled) setProduct(data); })
      .catch(() => { if (!cancelled) setProduct(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    // Visita desde un enlace de afiliado (?ref=CODIGO)
    trackReferral({ productSlug: slug }, location.search);
    return () => { cancelled = true; };
  }, [slug, location.search]);

  const inCart = useMemo(() => items.find((i) => i.product.id === product?.id)?.quantity || 0, [items, product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-slate-800">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-5" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Producto no disponible</h1>
          <p className="text-gray-500 mb-6">El producto que buscas ya no está publicado.</p>
          <Button onClick={() => navigate('/')} className="w-full h-12 rounded-xl font-bold">Ir al inicio</Button>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const canBuy = product.onlineSales && !isPreview && !outOfStock;
  const images = product.images.length ? product.images : [];
  const maxQty = Math.max(1, product.stock - inCart);

  const addToCart = () => {
    if (quantity + inCart > product.stock) {
      toast.error('No hay stock suficiente');
      return false;
    }
    // El carrito guarda el producto; el precio real lo vuelve a calcular el servidor al comprar
    addItem({ ...(product as any), sellerId: product.sellerId }, quantity);
    return true;
  };

  const handleAdd = () => {
    if (addToCart()) toast.success(`${product.name} añadido al carrito`);
  };

  const handleBuyNow = () => {
    if (!inCart && !addToCart()) return;
    // /app/checkout pide sesión: si no la hay, el login vuelve al checkout
    navigate('/app/checkout');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/producto/${product.slug || product.id}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado');
      }
    } catch {
      // cancelado
    }
  };

  const whatsapp = () => {
    const clean = (product.seller.whatsappNumber || '').replace(/\D/g, '');
    const number = clean.startsWith('595') ? clean : `595${clean.replace(/^0/, '')}`;
    const msg = `Hola ${product.seller.storeName}, me interesa "${product.name}". ¿Sigue disponible?`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-16">
      {/* Barra superior */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/tienda/${product.seller.storeSlug}`))}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <Link to={`/tienda/${product.seller.storeSlug}`} className="flex items-center gap-2 min-w-0">
            {product.seller.logo ? (
              <img src={product.seller.logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <Store className="w-5 h-5 text-gray-400" />
            )}
            <span className="font-bold text-sm truncate">{product.seller.storeName}</span>
            {product.seller.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
          </Link>
          <div className="flex items-center gap-1">
            {isAuthenticated && inCart > 0 && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/carrito')} aria-label="Ver carrito" className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{inCart}</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Compartir">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 grid md:grid-cols-2 gap-8">
        {/* Galería */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
          >
            {images.length ? (
              <img src={images[selectedImage] || images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-200" />
              </div>
            )}
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition',
                    selectedImage === i ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="uppercase tracking-wider text-[10px]">{product.category}</Badge>
            <AffiliateBadge rate={product.affiliate.rate} />
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">{product.name}</h1>

          <div className="flex items-end gap-3 mt-4">
            <span className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-lg text-gray-400 line-through font-bold mb-1">{formatCurrency(product.comparePrice)}</span>
            )}
          </div>

          <p className="mt-2 text-sm font-semibold">
            {outOfStock ? (
              <span className="text-red-500">Sin stock</span>
            ) : (
              <span className="text-emerald-600">Disponible ({product.stock})</span>
            )}
          </p>

          {product.description && (
            <p className="mt-5 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}

          <div className="mt-auto pt-6 space-y-3">
            {canBuy ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Cantidad</span>
                  <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menos">
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-bold">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} aria-label="Más">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {inCart > 0 && <span className="text-xs text-muted-foreground">{inCart} en el carrito</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-xl font-bold" onClick={handleAdd}>
                    Agregar al carrito
                  </Button>
                  <Button className="h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700" onClick={handleBuyNow}>
                    Comprar ahora
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-green-200 text-green-700 hover:bg-green-50" onClick={whatsapp}>
                <MessageCircle className="w-5 h-5 mr-2" />
                {outOfStock ? 'Consultar disponibilidad por WhatsApp' : 'Consultar por WhatsApp'}
              </Button>
            )}

            {product.affiliate.participates && !isPreview && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 p-4">
                <p className="text-sm text-violet-900 dark:text-violet-200 mb-3">
                  {product.affiliate.rate
                    ? <>Recomendá este producto y ganá <strong>{formatCurrency(Math.floor((product.price * product.affiliate.rate) / 100))}</strong> ({product.affiliate.rate}%) por cada venta.</>
                    : <>Este producto paga comisión a quien lo recomiende. Iniciá sesión para ver cuánto.</>}
                </p>
                <PromoteButton
                  kind="product"
                  productId={product.id}
                  title={product.name}
                  rate={product.affiliate.rate}
                  className="w-full h-11 rounded-xl border-violet-300 text-violet-700 hover:bg-violet-100 dark:text-violet-200 dark:border-violet-800 dark:hover:bg-violet-900/40"
                />
              </div>
            )}

            <Link
              to={`/tienda/${product.seller.storeSlug}`}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground pt-1"
            >
              <Store className="w-4 h-4" /> Ver más productos de {product.seller.storeName}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
