import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, BookOpen, CheckCircle2, CreditCard, Facebook,
  ChevronLeft, ChevronRight, FileText, Globe2, GraduationCap, HeartHandshake, Instagram, LayoutDashboard,
  LineChart, Mail, MapPin, Menu, Package, Phone, QrCode, ShieldCheck,
  ShoppingBag, Sparkles, Store, TrendingUp, Users, Wallet, X, Zap,
} from 'lucide-react';
import { storesApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { FloatingSocialButtons } from '@/components/client/FloatingSocialButtons';
import './LandingPage.css';

type FeaturedStore = {
  id: string;
  name: string;
  slug: string;
  banner?: string | null;
  logo?: string | null;
  category?: string | null;
  isVerified?: boolean;
};

const pillars = [
  {
    title: 'Educación Financiera',
    image: '/images/brand/education-concept.png',
    logo: '/images/logos/logo_ingenio_millonario.png',
    icon: GraduationCap,
    color: 'blue',
    description: 'Creamos y ofrecemos el curso especializado en Educación Financiera “Ingenio Millonario”, en la modalidad Aula Invertida. Creamos la app IM/Matriz Financiero/OSCORP y el producto educativo IM. Firma de CONVENIOS.',
  },
  {
    title: 'Empresarial',
    image: '/images/brand/hero-mockup.png',
    logo: '/images/logos/logo_empresarial.png',
    icon: Store,
    color: 'violet',
    description: 'Ofrecemos la Plataforma de Comercio Electrónico OSCORP-e, para la venta de productos y servicios las 24 horas a nivel nacional. Asesoramos y ofrecemos software a las microempresas para su crecimiento, mediante servicios integrales. Creamos el curso empresarial SOY EMPRESARI@. Firma de CONVENIOS.',
  },
  {
    title: 'Inversiones',
    image: '/images/brand/ecosystem-tablet-phone.png',
    logo: '/images/logos/logo_inversiones.png',
    icon: TrendingUp,
    color: 'teal',
    description: 'Ofrecemos la Plataforma de Crowdfunding OSCORP-i (FINTECH) para inversiones; juntando personas que necesitan con aquellos que puedan otorgarlos. Firma de CONVENIOS.',
  },
];

const ecosystem = [
  {
    title: 'Billetera Digital',
    eyebrow: 'MOVÉ TU DINERO',
    image: '/images/brand/ecosystem-tablet-phone.png',
    icon: Wallet,
    color: 'blue',
    features: [
      { title: 'Pagos QR Instantáneos', description: 'Escanea y paga en segundos en cualquier comercio adherido.', icon: QrCode },
      { title: 'Cargas y Retiros', description: 'Gestiona tu efectivo de forma digital con total seguridad.', icon: CreditCard },
      { title: 'Transferencias', description: 'Envía dinero a otros usuarios de la red Oscorp sin comisiones.', icon: ArrowRight },
      { title: 'Préstamos', description: 'Accede a líneas de crédito adaptadas a tu perfil financiero.', icon: ShieldCheck },
    ],
  },
  {
    title: 'Plataforma de Vendedores',
    eyebrow: 'HACÉ CRECER TU NEGOCIO',
    image: '/images/brand/hero-mockup.png',
    icon: LayoutDashboard,
    color: 'violet',
    features: [
      { title: 'POS Profesional', description: 'Terminal punto de venta con soporte para códigos de barras.', icon: ShoppingBag },
      { title: 'Gestión de Stock', description: 'Control de inventario en tiempo real para productos y servicios.', icon: Package },
      { title: 'Ventas a Crédito', description: 'Administra las cuentas corrientes de tus clientes fieles.', icon: CreditCard },
      { title: 'Multi-Red', description: 'Tus productos visibles en todo el ecosistema Oscorp-e.', icon: Globe2 },
    ],
  },
  {
    title: 'Inteligencia de Negocios',
    eyebrow: 'DECIDÍ CON INFORMACIÓN',
    image: '/images/brand/ecosystem-full.png',
    icon: LineChart,
    color: 'teal',
    features: [
      { title: 'Reportes en Tiempo Real', description: 'Visualiza tus KPIs de ventas, ganancias y comisiones.', icon: BarChart3 },
      { title: 'Exportación Profesional', description: 'Genera reportes en PDF, Excel y CSV para tu contabilidad.', icon: FileText },
      { title: 'Control Financiero', description: 'Seguimiento automático de ingresos y egresos del negocio.', icon: TrendingUp },
      { title: 'Gestión de Proveedores', description: 'Mantén ordenado tu historial de compras y suministros.', icon: Users },
    ],
  },
];

const testimonials = [
  { name: 'María González', role: 'Emprendedora', quote: 'Oscorp transformó mi negocio. Ahora vendo a todo el país y mis ingresos crecieron un 300%. La plataforma es increíblemente fácil de usar.' },
  { name: 'Carlos Martínez', role: 'Vendedor Profesional', quote: 'La billetera digital es increíble. Puedo pagar en cualquier tienda con solo escanear mi QR. Las transferencias son instantáneas.' },
  { name: 'Ana Rodríguez', role: 'Estudiante de Finanzas', quote: 'Los cursos de Ingenio Millonario cambiaron mi vida. Ahora tengo control total de mis finanzas y estoy construyendo mi patrimonio.' },
];

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
];

const heroSlides = [
  {
    eyebrow: 'Empresa paraguaya de economía colaborativa',
    title: 'CREER - CREAR -', highlight: 'CRECER DIFERENTE.',
    subtitle: 'Plataforma Integral',
    description: '',
    image: '/images/brand/ecosystem-full.png',
    imageAlt: 'Ecosistema digital de OSCORP en computadora, tableta y teléfono',
    action: 'Conocer OSCORP', href: '#servicios', secondAction: 'Ver Marketplace', secondHref: '/marketplace',
    note: 'Ideas, herramientas y oportunidades en un solo ecosistema',
  },
  {
    eyebrow: 'OSCORP-e · Plataforma multitienda',
    title: 'COMPRÁ Y VENDÉ', highlight: 'EN UN SOLO LUGAR.',
    subtitle: 'Marketplace para todo Paraguay',
    description: 'Descubrí productos y tiendas, o presentá tu negocio con una vidriera propia.',
    image: '/images/brand/multistore-shopping.png',
    imageAlt: 'Compradora explorando productos en una tienda digital',
    action: 'Explorar Marketplace', href: '/marketplace', secondAction: 'Crear mi tienda', secondHref: '/register',
    note: 'Productos, vendedores y oportunidades conectados',
  },
  {
    eyebrow: 'Ingenio Millonario · Educación financiera',
    title: 'APRENDÉ HOY.', highlight: 'CREÁ TU FUTURO.',
    subtitle: 'Conocimiento para tomar mejores decisiones',
    description: 'Cursos y herramientas que te ayudan a organizar tus finanzas y avanzar con tus proyectos.',
    image: '/images/brand/financial-learning.png',
    imageAlt: 'Profesional estudiando finanzas y trabajando en sus proyectos',
    action: 'Conocer Ingenio Millonario', href: '/app/ingenio', secondAction: 'Nuestros pilares', secondHref: '#servicios',
    note: 'Educación y herramientas para crecer',
  },
  {
    eyebrow: 'Soluciones para emprendedores',
    title: 'TU NEGOCIO', highlight: 'PUEDE CRECER.',
    subtitle: 'Herramientas en un mismo ecosistema',
    description: 'Comercio electrónico, gestión empresarial e inversiones para acompañar cada nueva etapa.',
    image: '/images/brand/ecosystem-tablet-phone.png',
    imageAlt: 'Herramientas digitales de OSCORP en tableta y teléfono',
    action: 'Ver soluciones', href: '#servicios', secondAction: 'Contactar', secondHref: '#contacto',
    note: 'Tecnología y educación al servicio de tus ideas',
  },
];

export default function LandingPage() {
  const { settings } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stores, setStores] = useState<FeaturedStore[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroSlides.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const heroSlide = heroSlides[heroIndex];
  const heroLink = (href: string, label: string, className: string) => href.startsWith('#')
    ? <a className={className} href={href}>{label} <ArrowRight size={18} /></a>
    : <Link className={className} to={href}>{label} <ArrowRight size={18} /></Link>;

  useEffect(() => {
    let cancelled = false;
    storesApi.getAll().then((data) => {
      if (!cancelled && Array.isArray(data)) {
        const seen = new Set<string>();
        const featured = (data as FeaturedStore[]).filter((store) => {
          if (/e2e|test/i.test(`${store.name} ${store.slug}`) || seen.has(store.name)) return false;
          seen.add(store.name);
          return true;
        }).sort((a, b) => Number(!!b.isVerified) - Number(!!a.isVerified));
        setStores(featured.slice(0, 3));
      }
    }).catch(() => { /* Store preview is optional; the marketplace remains available. */ });
    return () => { cancelled = true; };
  }, []);

  const siteDescription = settings.site_description && settings.site_description !== 'Sistema de Gestión Integrado'
    ? settings.site_description
    : 'Entregamos beneficios y soluciones en Educación Financiera, Empresarial e Inversiones. Ayudamos a las personas a generar riqueza con una actitud diferente.';
  const contactEmail = settings.contact_email && settings.contact_email !== 'soporte@oscorp.com' ? settings.contact_email : 'info@oscorp.com.py';
  const contactPhone = settings.contact_phone && settings.contact_phone !== '+595 900 000 000' ? settings.contact_phone : '+595 975 855585';
  const contactAddress = settings.contact_address && settings.contact_address !== 'Asunción, Paraguay'
    ? settings.contact_address
    : 'Calle Sebastián Ortiz (ex Calle 8) casi San Cosme. Barrio Santa Librada, Coronel Bogado, Itapúa, Paraguay';

  const sendContactEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const message = String(data.get('message') || '').trim();
    const body = `${message}\n\nNombre: ${name}\nEmail: ${email}`;
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="ip-page">
      <div className="ip-topline">OSCORP · Ingenio Empresarial <span>•</span> Creer, crear, crecer diferente</div>
      <header className="ip-header">
        <div className="ip-container ip-header-inner">
          <Link to="/" className="ip-logo" aria-label="OSCORP, ir al inicio"><img src="/oscorp-logo.png" alt="OSCORP Ingenio Empresarial" /></Link>
          <nav className={mobileMenuOpen ? 'ip-nav ip-nav-open' : 'ip-nav'} aria-label="Navegación principal">
            {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>)}
            <Link className="ip-mobile-market" to="/marketplace" onClick={() => setMobileMenuOpen(false)}>Entrar a la tienda <ArrowRight size={16} /></Link>
            <Link className="ip-mobile-auth" to="/login" onClick={() => setMobileMenuOpen(false)}>Iniciar sesión</Link>
            {settings.maintenance_mode !== 'true' && <Link className="ip-mobile-auth ip-mobile-auth-primary" to="/register" onClick={() => setMobileMenuOpen(false)}>Crear cuenta <ArrowRight size={16} /></Link>}
          </nav>
          <div className="ip-header-actions">
            <Link className="ip-login" to="/login">Iniciar sesión</Link>
            {settings.maintenance_mode !== 'true' && <Link className="ip-button ip-button-small" to="/register">Crear cuenta <ArrowRight size={16} /></Link>}
          </div>
          <button className="ip-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main>
        <section id="inicio" className="ip-hero ip-container" aria-label="Presentación de OSCORP">
          <div className="ip-hero-copy">
            <span className="ip-eyebrow ip-eyebrow-light"><Sparkles size={16} /> {heroSlide.eyebrow}</span>
            <h1 key={`title-${heroIndex}`}>{heroSlide.title} <em>{heroSlide.highlight}</em></h1>
            <p className="ip-hero-subtitle">{heroSlide.subtitle}</p>
            <p className="ip-hero-description">{heroSlide.description || siteDescription}</p>
            <div className="ip-hero-actions">{heroLink(heroSlide.href, heroSlide.action, 'ip-button')}{heroLink(heroSlide.secondHref, heroSlide.secondAction, 'ip-button ip-button-ghost')}</div>
            <div className="ip-hero-domains"><span><GraduationCap /> Educación financiera</span><span><Store /> Empresarial</span><span><TrendingUp /> Inversiones</span></div>
          </div>
          <div className="ip-hero-visual"><img key={heroSlide.image} src={heroSlide.image} alt={heroSlide.imageAlt} /><div className="ip-hero-note"><CheckCircle2 size={20} /><strong>{heroSlide.note}</strong></div></div>
          <div className="ip-hero-controls" aria-label="Cambiar imagen de presentación">
            <button type="button" aria-label="Imagen anterior" onClick={() => setHeroIndex((index) => (index - 1 + heroSlides.length) % heroSlides.length)}><ChevronLeft size={20} /></button>
            <div className="ip-hero-dots">{heroSlides.map((slide, index) => <button key={slide.eyebrow} type="button" aria-label={`Ver presentación ${index + 1}: ${slide.subtitle}`} aria-current={index === heroIndex ? 'true' : undefined} onClick={() => setHeroIndex(index)} />)}</div>
            <button type="button" aria-label="Imagen siguiente" onClick={() => setHeroIndex((index) => (index + 1) % heroSlides.length)}><ChevronRight size={20} /></button>
          </div>
        </section>

        <section id="servicios" className="ip-section ip-pillars-section">
          <div className="ip-container">
            <div className="ip-section-heading ip-center"><span className="ip-eyebrow">¿QUÉ HACEMOS?</span><h2>Nuestros <em>Pilares</em></h2><p>“Ayudamos a las personas para que descubran, desarrollen y aprovechen su ACTITUD para generar RIQUEZA.”</p></div>
            <div className="ip-pillars-grid">{pillars.map(({ title, image, logo, icon: Icon, color, description }) => <article className={`ip-pillar ip-${color}`} key={title}><div className="ip-pillar-image"><img src={image} alt="" loading="lazy" /><span className="ip-pillar-icon"><Icon size={23} /></span></div><div className="ip-pillar-content"><img className="ip-pillar-logo" src={logo} alt="" loading="lazy" /><h3>{title}</h3><p>{description}</p></div></article>)}</div>
          </div>
        </section>

        <section className="ip-section ip-matrix-section"><div className="ip-container ip-matrix-layout"><div className="ip-matrix-copy"><span className="ip-eyebrow">HERRAMIENTA EDUCATIVA</span><h2>Matriz <em>Ingenio Millonario</em></h2><p>Visualiza el camino hacia tu libertad financiera con nuestro sistema integral de educación y herramientas.</p><Link className="ip-button" to="/app/ingenio">Conocer Ingenio Millonario <ArrowRight size={18} /></Link></div><div className="ip-matrix-image"><img src="/images/brand/ingenio-infographic.png" alt="Matriz educativa Ingenio Millonario: camino hacia la libertad financiera" loading="lazy" /></div></div></section>

        <section className="ip-section ip-ecosystem-section"><div className="ip-container"><div className="ip-section-heading ip-center"><span className="ip-eyebrow">ECOSISTEMA OSCORP</span><h2>Soluciones 360° para tu <em>Crecimiento</em></h2><p>No solo somos una plataforma, somos una red integrada de servicios diseñados para potenciar cada aspecto de tu vida financiera y empresarial.</p></div><div className="ip-ecosystem-grid">{ecosystem.map(({ title, eyebrow, image, icon: Icon, color, features }) => <article className={`ip-solution ip-${color}`} key={title}><div className="ip-solution-image"><img src={image} alt="" loading="lazy" /><span><Icon size={25} /></span></div><div className="ip-solution-content"><span className="ip-solution-eyebrow">{eyebrow}</span><h3>{title}</h3><ul>{features.map(({ title: featureTitle, description, icon: FeatureIcon }) => <li key={featureTitle}><FeatureIcon size={19} /><span><strong>{featureTitle}</strong><small>{description}</small></span></li>)}</ul><Link to="/register">Comenzar ahora <ArrowRight size={17} /></Link></div></article>)}</div></div></section>

        <section id="marketplace" className="ip-section ip-marketplace-section"><div className="ip-container"><div className="ip-marketplace-hero"><div><span className="ip-eyebrow ip-eyebrow-light"><ShoppingBag size={15} /> COMMERCE CENTER</span><h2>Eleva tu <em>Presencia</em></h2><p>Marketplace multivendedor con tecnología de punta para escalar tu negocio sin límites.</p><div className="ip-hero-actions"><Link className="ip-button" to="/marketplace">Explorar la tienda <ArrowRight size={18} /></Link><Link className="ip-button ip-button-ghost" to="/register">Crear mi tienda</Link></div></div><img src="/images/marketplace-modern/hero-screen.png" alt="Una compradora muestra la tienda OSCORP en su teléfono" loading="lazy" /></div><div className="ip-market-categories" aria-label="Categorías del marketplace">{[{ label: 'Tecnología', icon: Zap }, { label: 'Moda', icon: ShoppingBag }, { label: 'Hogar', icon: Store }, { label: 'Deportes', icon: TrendingUp }, { label: 'Educación', icon: BookOpen }, { label: 'Servicios', icon: Globe2 }].map(({ label, icon: Icon }) => <Link key={label} to="/marketplace"><span><Icon size={22} /></span>{label}</Link>)}</div><div className="ip-stores-heading"><div><span className="ip-eyebrow">TIENDAS OSCORP</span><h3>Marcas de Éxito</h3></div><Link to="/marketplace">Ver todas <ArrowRight size={17} /></Link></div><div className="ip-stores-grid">{stores.length ? stores.map((store) => <Link className="ip-store" to={`/tienda/${store.slug}`} key={store.id}><div className="ip-store-image">{store.banner ? <img src={store.banner} alt="" loading="lazy" /> : <Store size={36} />}</div><div className="ip-store-body">{store.logo ? <img src={store.logo} alt="" loading="lazy" /> : <span><Store size={19} /></span>}<div><strong>{store.name}</strong><small>{store.category || 'Tienda OSCORP'} {store.isVerified && '· Verificada'}</small></div><ArrowRight size={17} /></div></Link>) : <div className="ip-store-empty">Conocé las tiendas y productos disponibles en el Marketplace de OSCORP. <Link to="/marketplace">Entrar a la tienda <ArrowRight size={16} /></Link></div>}</div><div className="ip-seller-cta"><div><h3>¿Listo para el siguiente nivel?</h3><p>Únete a la plataforma que está redefiniendo el comercio paraguayo.</p></div><div><Link className="ip-button" to="/register">Crear mi tienda <ArrowRight size={17} /></Link><Link className="ip-button ip-button-outline" to="/login">Panel de vendedor</Link></div></div></div></section>

        <section id="nosotros" className="ip-section ip-about-section"><div className="ip-container ip-about-layout"><div className="ip-about-photo"><img src="/images/brand/education-concept.png" alt="Educación y herramientas para crecer" loading="lazy" /><span>“Apoyamos los sueños de las personas.”</span></div><div className="ip-about-copy"><span className="ip-eyebrow">NUESTRO PROPÓSITO</span><h2>Te motivamos a <em>soñar en grande</em></h2><p>Apoyamos los sueños de las personas que quieran dar significado a sus vidas para que se conviertan en su YO más grande. Te motivamos a que sueñes en grande, a que lo hagas de una manera diferente y a que superes los obstáculos de TU propia vida.</p><p>Nosotros sabemos que puedes y el proceso para hacerlo te dará gran felicidad.</p><div className="ip-values">{['Ingenio', 'Integridad', 'Liderazgo', 'Innovación'].map((value) => <span key={value}><HeartHandshake size={18} />{value}</span>)}</div></div></div></section>

        <section className="ip-section ip-testimonials-section"><div className="ip-container"><div className="ip-section-heading ip-center"><span className="ip-eyebrow">TESTIMONIOS</span><h2>Confianza de <em>Primer Nivel</em></h2></div><div className="ip-testimonials-grid">{testimonials.map(({ name, role, quote }) => <figure key={name} className="ip-testimonial"><span className="ip-quote-mark">“</span><blockquote>{quote}</blockquote><figcaption><span className="ip-avatar">{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{name}</strong><small>{role}</small></span></figcaption></figure>)}</div></div></section>

        <section id="contacto" className="ip-section ip-contact-section"><div className="ip-container ip-contact-layout"><div className="ip-contact-copy"><span className="ip-eyebrow">CONEXIÓN GLOBAL</span><h2>Liderazgo en <em>Acción</em></h2><p>Estamos listos para potenciar tu visión corporativa. Contacta con nuestro equipo de expertos.</p><div className="ip-contact-list"><div><Phone /><span><small>LÍNEA DIRECTA</small><a href={`tel:${contactPhone.replace(/\s/g, '')}`}>{contactPhone}</a></span></div><div><Mail /><span><small>CONSULTAS</small><a href={`mailto:${contactEmail}`}>{contactEmail}</a></span></div><div><MapPin /><span><small>SEDE CENTRAL</small><strong>{contactAddress}</strong></span></div></div></div><div className="ip-contact-card"><h3>Envíanos un mensaje</h3><p>Completá tus datos y prepararemos un correo con tu consulta.</p><form onSubmit={sendContactEmail}><div className="ip-form-row"><label>Nombre<input name="name" type="text" placeholder="Tu nombre" required /></label><label>Email<input name="email" type="email" placeholder="tu@email.com" required /></label></div><label>Asunto<input name="subject" type="text" placeholder="Propósito de tu mensaje" required /></label><label>Mensaje<textarea name="message" placeholder="Describe tu consulta..." rows={5} required /></label><button className="ip-button" type="submit">Preparar mensaje <ArrowRight size={17} /></button></form></div></div></section>
      </main>

      <footer className="ip-footer"><div className="ip-container"><div className="ip-footer-grid"><div className="ip-footer-brand"><img src="/oscorp-logo.png" alt="OSCORP Ingenio Empresarial" /><p>{siteDescription}</p></div><div><h4>Plataforma</h4><Link to="/marketplace">Ecommerce OSCORP-e</Link><Link to="/app/ingenio">Ingenio Millonario</Link><Link to="/app/wallet">Fintech Crowdfunding</Link><Link to="/marketplace">Marketplace</Link></div><div><h4>Compañía</h4><a href="#nosotros">Propósito</a><a href="#servicios">Nuestros Pilares</a><a href="#marketplace">Tiendas Premium</a><a href="#contacto">Contacto</a></div><div><h4>Contacto</h4><span>{contactAddress}</span><a href={`tel:${contactPhone.replace(/\s/g, '')}`}>{contactPhone}</a><a href={`mailto:${contactEmail}`}>{contactEmail}</a></div></div><div className="ip-footer-bottom"><p>© {new Date().getFullYear()} OSCORP - Ingenio Empresarial. Todos los derechos reservados.</p><div><a href="https://www.facebook.com/share/1BfdPwqaZN/" aria-label="Facebook de OSCORP" target="_blank" rel="noopener noreferrer"><Facebook size={18} /></a><a href="https://www.instagram.com/oscorp_py?igsh=OGpxZnI4cTcxZWtw&utm_source=ig_contact_invite" aria-label="Instagram de OSCORP" target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a></div></div></div></footer>
      <InstallPrompt />
      <FloatingSocialButtons />
    </div>
  );
}
