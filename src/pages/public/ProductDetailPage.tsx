import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight,
  Info, Loader2, MessageCircle, Minus, Package, Plus, Share2,
  ShieldCheck, ShoppingBag, ShoppingCart, Store, Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api';
import { trackReferral, trackStoreVisit } from '@/lib/affiliate';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { SiteFooter } from '@/components/shared/SiteFooter';
import type { Product } from '@/types';
import { PromoteButton, AffiliateBadge } from '@/components/affiliate/PromoteButton';
import { AuctionPanel } from '@/components/auction/AuctionPanel';
import { ProductComments } from '@/components/comments/ProductComments';
import { OfferCountdown } from '@/components/offer/OfferCountdown';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import './ProductDetailPage.css';

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
  deliveryMode?: 'arrange' | 'pickup' | 'free' | 'paid';
  deliveryFee?: number;
  sku: string;
  tags?: string[];
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
  auction: ComponentProps<typeof AuctionPanel>['initial'];
  offer: { active: boolean; expired: boolean; endsAt: string | null; discountPercent: number } | null;
}

const toCartProduct = (product: PublicProduct, stock = product.stock): Product => ({
  ...product,
  slug: product.slug ?? undefined,
  comparePrice: product.comparePrice ?? undefined,
  type: product.type as Product['type'],
  stock,
  visibility: product.tags?.includes('oscorp-demo') ? 'local' : 'online',
  status: 'active',
  tags: product.tags ?? [],
  isFeatured: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const illustrativeImage = (name: string, category: string) => {
  const value = `${name} ${category}`.toLowerCase();
  const base = '/images/marketplace-modern/products/';
  if (/iphone|tel[eé]fono|celular|smartphone/.test(value)) return `${base}smartphone.png`;
  if (/auricular|aud[ií]fono/.test(value)) return `${base}headphones.png`;
  if (/notebook|laptop|computadora/.test(value)) return `${base}laptop.png`;
  if (/reloj|smartwatch/.test(value)) return `${base}smartwatch.png`;
  if (/bolso|cartera/.test(value)) return `${base}handbag.png`;
  return null;
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('from') === 'vendedor';
  const { addItem, items, itemCount } = useCartStore();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loadedForSlug, setLoadedForSlug] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [failedImage, setFailedImage] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    productsApi.getPublic(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setSelectedImage(0);
        setQuantity(1);
        setFailedImage(false);
        if (!isPreview && data?.seller?.storeSlug && !data.tags?.includes('oscorp-demo')) {
          trackStoreVisit(data.seller.storeSlug);
        }
      })
      .catch(() => { if (!cancelled) setProduct(null); })
      .finally(() => { if (!cancelled) setLoadedForSlug(slug); });
    trackReferral({ productSlug: slug }, location.search);
    return () => { cancelled = true; };
  }, [slug, location.search, isPreview]);

  const inCart = useMemo(
    () => items.find((item) => item.product.id === product?.id)?.quantity || 0,
    [items, product?.id],
  );

  if (loadedForSlug !== slug) {
    return <div className="product-page product-state"><Loader2 className="animate-spin" size={38} /><span>Cargando producto…</span></div>;
  }

  if (!product) {
    return (
      <div className="product-page product-state">
        <ShoppingBag size={52} />
        <h1>Producto no disponible</h1>
        <p>Esta publicación ya no está disponible.</p>
        <Link to="/marketplace" className="product-primary-link">Explorar productos <ArrowRight size={18} /></Link>
      </div>
    );
  }

  const isDemo = product.tags?.includes('oscorp-demo') ?? false;
  const outOfStock = product.stock <= 0;
  const canBuy = !isDemo && product.onlineSales && !isPreview && !outOfStock && !product.offer?.expired;
  const canTryCart = isDemo && !isPreview;
  const maxQty = Math.max(1, (isDemo ? 99 : product.stock) - inCart);
  const fallbackImage = illustrativeImage(product.name, product.category);
  const activeImage = failedImage ? fallbackImage : (product.images[selectedImage] || product.images[0] || fallbackImage);
  const isIllustrative = failedImage || (!product.images.length && !!fallbackImage);
  const savings = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const addToCart = () => {
    if (quantity + inCart > (isDemo ? 99 : product.stock)) {
      toast.error(isDemo ? 'Máximo 99 unidades en el carrito de prueba' : 'No hay stock suficiente');
      return false;
    }
    addItem(toCartProduct(product, isDemo ? 99 : product.stock), quantity);
    return true;
  };

  const handleAdd = () => {
    if (addToCart()) toast.success(isDemo ? 'Producto añadido al carrito de prueba' : 'Producto añadido al carrito');
  };

  const handleBuyNow = () => {
    if (!inCart && !addToCart()) return;
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
      // El usuario canceló la acción de compartir.
    }
  };

  const whatsapp = () => {
    const clean = (product.seller.whatsappNumber || '').replace(/\D/g, '');
    if (!clean) {
      toast.error('Esta tienda no tiene WhatsApp disponible');
      return;
    }
    const number = clean.startsWith('595') ? clean : `595${clean.replace(/^0/, '')}`;
    const message = `Hola ${product.seller.storeName}, me interesa "${product.name}". ¿Sigue disponible?`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="product-shell">
      <div className="product-page">
      <header className="product-header">
        <div className="product-header-inner">
          <button type="button" className="product-header-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(`/tienda/${product.seller.storeSlug}`))}>
            <ArrowLeft size={18} /> <span>Volver</span>
          </button>
          <Link to="/" className="product-header-brand"><span className="product-brand-mark"><ShoppingCart size={18} /></span><span>OSCORP<small>Tu multitienda en Paraguay</small></span></Link>
          <div className="product-header-actions">
            <button type="button" onClick={handleShare} aria-label="Compartir producto"><Share2 size={19} /></button>
            <Link to="/carrito" aria-label={`Ver carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`} className="product-header-cart">
              <ShoppingBag size={19} />{itemCount > 0 && <b>{itemCount}</b>}
            </Link>
          </div>
        </div>
      </header>

      <main className="product-container">
        <nav className="product-breadcrumb" aria-label="Ruta de navegación">
          <Link to="/">Inicio</Link><ChevronRight size={15} />
          <Link to="/marketplace">Marketplace</Link><ChevronRight size={15} />
          <Link to={`/tienda/${product.seller.storeSlug}`}>{product.seller.storeName}</Link><ChevronRight size={15} />
          <span>{product.name}</span>
        </nav>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-image-frame">
              {activeImage ? (
                <img src={activeImage} alt={product.name} onError={() => setFailedImage(true)} />
              ) : (
                <div className="product-no-image"><Package size={70} /><span>Imagen no disponible</span></div>
              )}
              {isDemo && <span className="product-photo-badge">Muestra OSCORP</span>}
              {isIllustrative && <span className="product-photo-caption">Foto ilustrativa</span>}
              {savings > 0 && !isDemo && <span className="product-discount-badge">-{savings}%</span>}
            </div>
            {product.images.length > 1 && (
              <div className="product-thumbnails" aria-label="Fotos del producto">
                {product.images.map((image, index) => (
                  <button key={image} type="button" className={selectedImage === index ? 'active' : ''} onClick={() => { setSelectedImage(index); setFailedImage(false); }} aria-label={`Ver foto ${index + 1}`} aria-pressed={selectedImage === index}>
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="product-gallery-assurance">
              <span><ShieldCheck size={19} /> Tiendas verificadas</span>
              <span><Truck size={19} /> Opciones de entrega</span>
              <span><MessageCircle size={19} /> Atención directa</span>
            </div>
          </div>

          <section className="product-info-card">
            <div className="product-topline">
              <span className="product-category">{product.category}</span>
              {isDemo && <span className="product-demo-pill">Producto de muestra</span>}
              {!isDemo && product.seller.isVerified && <span className="product-verified"><CheckCircle2 size={15} /> Tienda verificada</span>}
              {!isDemo && <FavoriteButton productId={product.id} className="product-favorite" />}
            </div>
            <h1>{product.name}</h1>
            <Link to={`/tienda/${product.seller.storeSlug}`} className="product-seller-link"><Store size={16} /> Vendido por <strong>{product.seller.storeName}</strong><ArrowRight size={15} /></Link>
            {product.offer && <OfferCountdown offer={product.offer} className="product-offer" />}
            {!product.auction && (
              <div className="product-price-block">
                <div className="product-price-line">
                  <strong>{formatCurrency(product.price)}</strong>
                  {savings > 0 && <del>{formatCurrency(product.comparePrice!)}</del>}
                </div>
                <span className={isDemo ? 'product-demo-price' : outOfStock ? 'product-out-of-stock' : 'product-in-stock'}>
                  {isDemo ? 'Precio ilustrativo · Sin cobro' : outOfStock ? 'Sin stock' : `Disponible · ${product.stock} en stock`}
                </span>
              </div>
            )}
            {!isDemo && <div className="product-delivery-info"><Truck size={19} /><span><strong>{product.type !== 'physical' ? 'Entrega digital o servicio' : product.deliveryMode === 'free' ? 'Delivery gratis' : product.deliveryMode === 'paid' ? `Delivery: ${formatCurrency(Number(product.deliveryFee || 0))}` : product.deliveryMode === 'pickup' ? 'Retiro en tienda' : 'Delivery a coordinar'}</strong><small>{product.deliveryMode === 'paid' ? 'Este costo se suma una vez por producto al finalizar la compra.' : product.deliveryMode === 'arrange' || !product.deliveryMode ? 'Consultá con el vendedor por el envío o elegí retiro en tienda.' : 'Vas a confirmar la modalidad al pagar.'}</small></span></div>}

            <div className="product-description">
              <h2>Sobre este producto</h2>
              <p>{product.description || 'La tienda aún no agregó una descripción detallada.'}</p>
            </div>

            {(canBuy || canTryCart) && !product.auction && (
              <div className="product-purchase">
                <div className="product-quantity-row">
                  <label>Cantidad</label>
                  <div className="product-stepper">
                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Reducir cantidad"><Minus size={16} /></button>
                    <span aria-live="polite">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))} disabled={quantity >= maxQty} aria-label="Aumentar cantidad"><Plus size={16} /></button>
                  </div>
                  {inCart > 0 && <small>{inCart} en el carrito</small>}
                </div>
                <div className="product-actions">
                  <button type="button" className="product-add-button" onClick={handleAdd}><ShoppingBag size={20} /> {isDemo ? 'Añadir al carrito de prueba' : 'Añadir al carrito'}</button>
                  {isDemo ? (
                    <Link to="/carrito" className="product-buy-button">Ver carrito <ArrowRight size={18} /></Link>
                  ) : (
                    <button type="button" className="product-buy-button" onClick={handleBuyNow}>Comprar ahora <ArrowRight size={18} /></button>
                  )}
                </div>
              </div>
            )}

            {isDemo && (
              <div className="product-demo-notice"><Info size={19} /><p><strong>Así funciona el carrito.</strong> Podés agregar este producto, cambiar cantidades y quitarlo para probar la experiencia. No se hará un pedido ni un cobro.</p></div>
            )}
            {!isDemo && product.auction && (
              <AuctionPanel productId={product.id} initial={product.auction} readOnly={isPreview} onPay={() => {
                if (!inCart) addItem(toCartProduct(product), 1);
                navigate('/app/checkout');
              }} />
            )}
            {!isDemo && !product.auction && !canBuy && (
              <button type="button" className="product-whatsapp-button" onClick={whatsapp}><MessageCircle size={19} /> {outOfStock ? 'Consultar disponibilidad' : 'Consultar por WhatsApp'}</button>
            )}
            {!isDemo && product.affiliate.participates && !isPreview && (
              <div className="product-affiliate">
                <AffiliateBadge rate={product.affiliate.rate} />
                <p>{product.affiliate.rate ? `Recomendá este producto y ganá ${formatCurrency(Math.floor(product.price * product.affiliate.rate / 100))} por venta.` : 'Este producto participa en el programa de afiliados.'}</p>
                <PromoteButton kind="product" productId={product.id} title={product.name} rate={product.affiliate.rate} />
              </div>
            )}
            <div className="product-safety"><ShieldCheck size={20} /><span>{isDemo ? 'Carrito de prueba sin pagos' : 'Compra protegida por OSCORP'}</span></div>
          </section>
        </div>
        <section className="product-store-band">
          <div className="product-store-icon">{product.seller.logo ? <img src={product.seller.logo} alt="" /> : <Store size={29} />}</div>
          <div><span>CONOCÉ LA TIENDA</span><h2>{product.seller.storeName}</h2><p>{isDemo ? 'Explorá más productos de muestra' : 'Mirá todos sus productos y datos de contacto'}</p></div>
          <Link to={`/tienda/${product.seller.storeSlug}`}>Visitar tienda <ArrowRight size={18} /></Link>
        </section>
        {!isDemo && <div className="product-comments"><ProductComments productId={product.id} /></div>}
      </main>
      </div>
      <SiteFooter />
    </div>
  );
}
