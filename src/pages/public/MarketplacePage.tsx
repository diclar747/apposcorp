import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CreditCard,
  Dumbbell, Flame, Gavel, Gift, GraduationCap, Headphones, Heart, Home,
  Laptop, MapPin, Menu, PackageCheck, Search, ShieldCheck, Shirt, ShoppingBag,
  ShoppingCart, Smartphone, Sparkles, Store, Tag, Truck, Users, X,
} from 'lucide-react';
import { productsApi, storesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore, useCartStore } from '@/stores';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { AuctionCardBadge } from '@/components/auction/AuctionCardBadge';
import './MarketplacePage.css';

type Product = {
  id: string;
  sku?: string;
  slug?: string | null;
  name: string;
  category?: string;
  images?: string[];
  price: number;
  comparePrice?: number | null;
  stock?: number;
  offer?: { active: boolean; discountPercent: number } | null;
  auctionStatus?: string | null;
  auctionEndsAt?: string | null;
  seller?: { storeName?: string; isVerified?: boolean };
  isFeatured?: boolean;
  tags?: string[];
};

type MarketplaceStore = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  banner?: string | null;
  logo?: string | null;
  description?: string | null;
  isVerified?: boolean;
  productCount?: number;
  products?: { images?: string[] }[];
};

type Filter = 'all' | 'offers' | 'auctions';

const categoryLinks = [
  { label: 'Tecnología', icon: Laptop, color: 'blue', terms: ['tecnolog', 'electron'] },
  { label: 'Celulares', icon: Smartphone, color: 'cyan', terms: ['celular', 'telefono', 'smartphone'] },
  { label: 'Computación', icon: Laptop, color: 'indigo', terms: ['comput', 'informat'] },
  { label: 'Hogar', icon: Home, color: 'green', terms: ['hogar', 'casa', 'deco'] },
  { label: 'Moda', icon: Shirt, color: 'pink', terms: ['moda', 'ropa', 'indument'] },
  { label: 'Belleza', icon: Sparkles, color: 'rose', terms: ['belleza', 'cosmet', 'cuidado'] },
  { label: 'Deportes', icon: Dumbbell, color: 'slate', terms: ['deport', 'fitness'] },
  { label: 'Juguetes', icon: Gift, color: 'orange', terms: ['juguet', 'infantil'] },
  { label: 'Libros', icon: BookOpen, color: 'purple', terms: ['libro', 'lectura'] },
  { label: 'Cursos', icon: GraduationCap, color: 'blue', terms: ['curso', 'educa'] },
];

const heroSlides = [
  {
    image: '/images/marketplace-modern/hero-screen.png',
    eyebrow: 'Bienvenido a OSCORP',
    title: <>Compra, vende,<br />aprende y gana<br />en <em>un solo lugar</em></>,
    description: 'Productos, tiendas oficiales, cursos y grandes oportunidades para todo Paraguay.',
    cta: 'Explorar ahora',
    action: 'products',
  },
  {
    image: '/images/marketplace-modern/courses.jpg',
    eyebrow: 'Ingenio Millonario',
    title: <>Aprendé hoy.<br />Creá tu <em>futuro.</em></>,
    description: 'Cursos y herramientas para dar el siguiente paso en tus proyectos.',
    cta: 'Conocer los cursos',
    action: 'courses',
  },
  {
    image: '/images/marketplace-modern/offers.jpg',
    eyebrow: 'Descubrí más por menos',
    title: <>Ofertas que<br /><em>valen la pena.</em></>,
    description: 'Encontrá precios especiales de las tiendas de nuestra comunidad.',
    cta: 'Ver ofertas',
    action: 'offers',
  },
];

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isDemoProduct = (product: Product) => product.tags?.includes('oscorp-demo') ?? false;
const isAutomatedTestName = (value?: string | null) => /(?:^|[\s_-])e2e(?:$|[\s_-])|(?:^|[\s_-])test(?:$|[\s_-])/i.test(value || '');
const isAutomatedTestProduct = (product: Product) =>
  isAutomatedTestName(product.seller?.storeName) ||
  isAutomatedTestName(product.slug) ||
  /^(?:ProdA|ProdB|ProdC|ProdOtra|FOTO\s*\d+)$/i.test(product.name);

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ImageWithFallback({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) return <div className={`mp-image-fallback ${className || ''}`}><ShoppingBag aria-hidden="true" /></div>;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} />;
}

export default function MarketplacePage() {
  const { isAuthenticated } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<MarketplaceStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [slide, setSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([productsApi.getAll(), storesApi.getAll()]).then(([productResult, storeResult]) => {
      if (cancelled) return;
      if (productResult.status === 'fulfilled' && Array.isArray(productResult.value)) setProducts(productResult.value.filter((product: Product) => !isAutomatedTestProduct(product)));
      if (storeResult.status === 'fulfilled' && Array.isArray(storeResult.value)) setStores(storeResult.value);
      setLoadError(productResult.status === 'rejected' || storeResult.status === 'rejected');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (filter === 'offers' && !product.offer?.active) return false;
    if (filter === 'auctions' && product.auctionStatus !== 'open') return false;
    if (activeCategory) {
      const match = categoryLinks.find((category) => category.label === activeCategory);
      const category = normalize(product.category || '');
      if (match && !match.terms.some((term) => category.includes(term))) return false;
    }
    const search = normalize(query.trim());
    return !search || [product.name, product.category, product.seller?.storeName]
      .some((value) => normalize(value || '').includes(search));
  }), [products, filter, activeCategory, query]);

  const orderedStores = useMemo(() => {
    const seen = new Set<string>();
    return stores.filter((store) => !isAutomatedTestName(store.name) && !isAutomatedTestName(store.slug) && (store.productCount ?? store.products?.length ?? 0) > 0).sort((a, b) => {
      const score = (store: MarketplaceStore) => Number(!!store.isVerified) * 4 + Number(!!store.banner) * 3 + Number(!!store.logo) * 2 + Number((store.productCount || 0) > 0);
      return score(b) - score(a);
    }).filter((store) => {
      const name = normalize(store.name);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [stores]);
  const featuredStores = showAllStores ? orderedStores : orderedStores.slice(0, 6);
  const visibleProducts = useMemo(() => [...filteredProducts].sort((a, b) => {
    const score = (product: Product) => Number(!!product.images?.[0]) * 4 + Number(!!product.isFeatured) * 2 + Number(!!product.offer?.active);
    return score(b) - score(a) || (isDemoProduct(a) && isDemoProduct(b) ? (a.sku || '').localeCompare(b.sku || '') : 0);
  }).slice(0, 12), [filteredProducts]);

  const chooseFilter = (next: Filter) => {
    setFilter(next);
    setActiveCategory(null);
    setMobileMenuOpen(false);
    window.setTimeout(() => scrollToSection('productos'), 40);
  };

  const chooseCategory = (category: string | null) => {
    setActiveCategory(category);
    setFilter('all');
    setMobileMenuOpen(false);
    window.setTimeout(() => scrollToSection('productos'), 40);
  };

  const handleHeroAction = () => {
    if (heroSlides[slide].action === 'offers') chooseFilter('offers');
    else if (heroSlides[slide].action === 'courses') window.location.href = '/app/cursos';
    else scrollToSection('productos');
  };

  const changeSlide = (step: number) => setSlide((current) => (current + step + heroSlides.length) % heroSlides.length);

  return (
    <div className="mp-page" id="inicio">
      <div className="mp-topline">Tu multitienda en Paraguay <span>•</span> Descubrí, comprá y crecé con OSCORP</div>
      <header className="mp-header">
        <div className="mp-container mp-header-inner">
          <Link to="/" className="mp-logo" aria-label="OSCORP, ir al inicio">
            <img src="/oscorp-logo.png" alt="OSCORP Ingenio Empresarial" />
          </Link>

          <form className="mp-search" role="search" onSubmit={(event) => { event.preventDefault(); scrollToSection('productos'); }}>
            <label className="mp-sr-only" htmlFor="marketplace-search">Buscar productos y tiendas</label>
            <input id="marketplace-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos, tiendas, cursos..." />
            <button type="submit" aria-label="Buscar"><Search size={21} /></button>
          </form>

          <div className="mp-header-actions">
            <div className="mp-location"><MapPin size={20} /><span>Enviar a<strong>Asunción</strong></span></div>
            <Link className="mp-header-action" to={isAuthenticated ? '/app/favoritos' : '/login'} aria-label="Favoritos"><Heart size={21} /><span>Favoritos</span></Link>
            <Link className="mp-header-action mp-cart-action" to="/carrito" aria-label={`Carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}><ShoppingCart size={22} />{itemCount > 0 && <b>{itemCount}</b>}<span>Carrito</span></Link>
            <Link className="mp-user-action" to={isAuthenticated ? '/app' : '/login'} aria-label={isAuthenticated ? 'Mi cuenta' : 'Ingresar'}><Users size={21} /></Link>
            <button className="mp-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}>{mobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      <nav className={`mp-nav ${mobileMenuOpen ? 'mp-nav-open' : ''}`} aria-label="Navegación principal">
        <div className="mp-container mp-nav-inner">
          <button className="mp-all-categories" onClick={() => { setMobileMenuOpen(false); scrollToSection('categorias'); }}><Menu size={17} /> Todas las categorías</button>
          <Link to="/"><Home size={17} /> Inicio</Link>
          <Link className="mp-nav-current" to="/marketplace"><ShoppingBag size={17} /> Marketplace</Link>
          <button onClick={() => { setMobileMenuOpen(false); scrollToSection('tiendas'); }}><Store size={17} /> Tiendas</button>
          <button onClick={() => chooseFilter('offers')}><Tag size={17} /> Ofertas</button>
          <button onClick={() => chooseFilter('auctions')}><Gavel size={17} /> Subastas</button>
          <Link to="/app/ingenio"><GraduationCap size={17} /> Ingenio Millonario</Link>
          <Link to="/vendedor"><ShoppingBag size={17} /> Vender</Link>
          <Link to="/app/afiliados"><Headphones size={17} /> Afiliados</Link>
        </div>
      </nav>

      <main>
        <div className="mp-container">
          <section className={`mp-hero mp-hero-${slide}`} aria-label="Destacados">
            {heroSlides.map((hero, index) => <img key={hero.image} className={`mp-hero-image ${slide === index ? 'is-active' : ''}`} src={hero.image} alt="" aria-hidden="true" />)}
            <div className="mp-hero-shade" />
            <div className="mp-hero-content">
              <p className="mp-hero-eyebrow"><Sparkles size={15} /> {heroSlides[slide].eyebrow}</p>
              <h1>{heroSlides[slide].title}</h1>
              <p>{heroSlides[slide].description}</p>
              <button className="mp-primary-button" onClick={handleHeroAction}>{heroSlides[slide].cta}<ArrowRight size={18} /></button>
            </div>
            {slide === 0 && <div className="mp-hero-pills" aria-hidden="true">
              <span><ShoppingCart /> Productos de calidad</span><span><GraduationCap /> Cursos online</span>
              <span><Gavel /> Subastas en vivo</span><span><Tag /> Ofertas especiales</span><span><Users /> Ganá con afiliados</span>
            </div>}
            <button className="mp-hero-arrow mp-hero-prev" onClick={() => changeSlide(-1)} aria-label="Banner anterior"><ChevronLeft /></button>
            <button className="mp-hero-arrow mp-hero-next" onClick={() => changeSlide(1)} aria-label="Banner siguiente"><ChevronRight /></button>
            <div className="mp-hero-dots" aria-label="Elegir banner">{heroSlides.map((hero, index) => <button key={hero.eyebrow} className={slide === index ? 'is-active' : ''} onClick={() => setSlide(index)} aria-label={`Ver banner ${index + 1}`} aria-current={slide === index ? 'true' : undefined} />)}</div>
          </section>

          <section className="mp-categories" id="categorias" aria-label="Categorías">
            {categoryLinks.map(({ label, icon: Icon, color }) => <button key={label} className={`mp-category mp-${color} ${activeCategory === label ? 'is-active' : ''}`} onClick={() => label === 'Cursos' ? window.location.assign('/app/cursos') : chooseCategory(label)}><span><Icon size={26} strokeWidth={2.2} /></span><strong>{label}</strong></button>)}
            <button className="mp-category mp-violet" onClick={() => chooseFilter('auctions')}><span><Gavel size={26} /></span><strong>Subastas</strong></button>
            <button className="mp-category mp-orange" onClick={() => chooseFilter('offers')}><span><Flame size={26} /></span><strong>Ofertas</strong></button>
          </section>

          <section className="mp-trust" aria-label="Beneficios">
            <div><span className="mp-trust-icon mp-trust-blue"><Truck /></span><p><strong>Envíos a todo Paraguay</strong><small>Rápido y seguro</small></p></div>
            <div><span className="mp-trust-icon mp-trust-indigo"><CreditCard /></span><p><strong>Múltiples métodos de pago</strong><small>Elegí cómo pagar</small></p></div>
            <div><span className="mp-trust-icon mp-trust-green"><ShieldCheck /></span><p><strong>Compra con confianza</strong><small>Tiendas verificadas</small></p></div>
          </section>

          <section className="mp-promos" aria-label="Descubrí más en OSCORP">
            <article className="mp-promo mp-promo-courses"><img src="/images/marketplace-modern/courses.jpg" alt="" loading="lazy" /><div className="mp-promo-shade" /><div className="mp-promo-content"><GraduationCap size={30} /><h2>Ingenio Millonario</h2><h3>Cursos online para un mejor futuro</h3><p>Aprendé, emprendé y crecé.</p><Link to="/app/cursos">Ver cursos <ArrowRight size={16} /></Link></div></article>
            <article className="mp-promo mp-promo-auctions"><img src="/images/marketplace-modern/auctions.jpg" alt="" loading="lazy" /><div className="mp-promo-content"><Gavel size={30} /><h2>Subastas en vivo</h2><h3>Encontrá productos únicos al mejor precio</h3><button onClick={() => chooseFilter('auctions')}>Participar ahora <ArrowRight size={16} /></button></div></article>
            <article className="mp-promo mp-promo-offers"><img src="/images/marketplace-modern/offers.jpg" alt="" loading="lazy" /><div className="mp-promo-content"><Flame size={30} /><h2>Ofertas especiales</h2><h3>Grandes descuentos por tiempo limitado</h3><button onClick={() => chooseFilter('offers')}>Ver ofertas <ArrowRight size={16} /></button></div></article>
          </section>

          <section className="mp-section" id="tiendas">
            <div className="mp-section-heading"><div><p className="mp-kicker">COMPRÁ EN COMUNIDAD</p><h2><Store size={26} /> Tiendas destacadas</h2><span>Conocé nuestras tiendas y emprendedores</span></div>{orderedStores.length > 6 && <button className="mp-view-all" onClick={() => setShowAllStores((value) => !value)}>{showAllStores ? 'Ver menos' : 'Ver todas las tiendas'} <ArrowRight size={17} /></button>}</div>
            {loading ? <div className="mp-card-grid mp-store-grid">{Array.from({ length: 6 }, (_, index) => <div className="mp-skeleton mp-store-card" key={index} />)}</div> : featuredStores.length ? <div className="mp-card-grid mp-store-grid">{featuredStores.map((store) => <Link className="mp-store-card" key={store.id} to={`/tienda/${store.slug}`}><div className="mp-store-cover"><ImageWithFallback src={store.banner || store.products?.[0]?.images?.[0]} alt={store.name} />{store.isVerified && <span className="mp-verified"><CheckCircle2 size={13} /> Verificada</span>}</div><div className="mp-store-info"><div className="mp-store-logo">{store.logo ? <img src={store.logo} alt="" loading="lazy" /> : <Store size={19} />}</div><div><h3>{store.name}</h3><p>{store.category || 'Tienda OSCORP'} · {store.productCount ?? 0} productos</p></div></div><span className="mp-store-visit">Visitar tienda <ArrowRight size={13} /></span></Link>)}</div> : <div className="mp-empty"><Store size={28} /><strong>Pronto habrá tiendas para explorar</strong><span>Volvé a visitarnos para descubrir nuevas propuestas.</span></div>}
          </section>

          <section className="mp-section mp-product-section" id="productos">
            <div className="mp-section-heading"><div><p className="mp-kicker">ENCONTRÁ ALGO PARA VOS</p><h2><ShoppingBag size={26} /> {filter === 'offers' ? 'Productos en oferta' : filter === 'auctions' ? 'Subastas en vivo' : activeCategory ? activeCategory : query ? 'Resultados de búsqueda' : 'Descubrí productos'}</h2><span>{query ? `Buscando “${query}”` : activeCategory ? `Explorando ${activeCategory.toLowerCase()}` : 'Descubrí lo que ofrecen nuestras tiendas'}</span></div>{(filter !== 'all' || activeCategory || query) && <button className="mp-view-all" onClick={() => { setFilter('all'); setActiveCategory(null); setQuery(''); }}>Ver todos <ArrowRight size={17} /></button>}</div>
            {loadError && <div className="mp-api-notice">Algunos datos no se pudieron cargar. Revisá la conexión e intentá recargar la página.</div>}
            {loading ? <div className="mp-card-grid mp-product-grid">{Array.from({ length: 8 }, (_, index) => <div className="mp-skeleton mp-product-card" key={index} />)}</div> : visibleProducts.length ? <div className="mp-card-grid mp-product-grid">{visibleProducts.map((product) => <article className="mp-product-card" key={product.id}><Link to={`/producto/${product.slug || product.id}`} className="mp-product-image"><ImageWithFallback src={product.images?.[0]} alt={product.name} />{isDemoProduct(product) && <span className="mp-demo-badge">Producto demo</span>}{product.offer?.active && product.offer.discountPercent > 0 && <span className="mp-discount">-{product.offer.discountPercent}%</span>}{product.auctionStatus === 'open' && <span className="mp-auction-badge"><AuctionCardBadge status={product.auctionStatus} endsAt={product.auctionEndsAt} /></span>}</Link>{!isDemoProduct(product) && <FavoriteButton productId={product.id} className="mp-favorite" />}<div className="mp-product-info"><span className="mp-product-store">{product.seller?.storeName || product.category || 'OSCORP'}</span><Link to={`/producto/${product.slug || product.id}`}><h3>{product.name}</h3></Link><div className="mp-prices"><strong>{formatCurrency(product.price)}</strong>{product.offer?.active && product.comparePrice && <del>{formatCurrency(product.comparePrice)}</del>}</div>{isDemoProduct(product) && <span className="mp-demo-price-note">Precio ilustrativo</span>}<span className="mp-product-extra">{isDemoProduct(product) ? 'Muestra · No disponible para compra' : product.stock === 0 ? 'Sin stock' : product.auctionStatus === 'open' ? 'Subasta disponible' : 'Ver detalles'} <ArrowRight size={13} /></span></div></article>)}</div> : <div className="mp-empty"><Search size={28} /><strong>No encontramos productos con esos filtros</strong><span>Probá otra búsqueda o explorá todas las categorías.</span><button onClick={() => { setFilter('all'); setActiveCategory(null); setQuery(''); }}>Ver todos los productos</button></div>}
          </section>

          <section className="mp-bottom-banner"><div><p>TODO EN UN SOLO LUGAR</p><h2>Tu próxima oportunidad<br />está en OSCORP.</h2><span>Comprá, aprendé o hacé crecer tu negocio con una sola cuenta.</span></div><Link to={isAuthenticated ? '/app' : '/register'}>{isAuthenticated ? 'Ir a mi cuenta' : 'Crear mi cuenta'} <ArrowRight size={18} /></Link><PackageCheck aria-hidden="true" /></section>
        </div>
      </main>

      <footer className="mp-footer"><div className="mp-container"><div className="mp-footer-brand"><img src="/oscorp-logo.png" alt="OSCORP Ingenio Empresarial" /><span>Tu multitienda en Paraguay</span></div><div><Link to="/">Sobre OSCORP</Link><Link to="/precios">Planes para vender</Link><Link to="/app/afiliados">Afiliados</Link><Link to="/login">Mi cuenta</Link></div><p>© {new Date().getFullYear()} OSCORP. Hecho para Paraguay.</p></div></footer>
    </div>
  );
}
