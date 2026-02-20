import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, TrendingUp, ShoppingBag,
  Users, Store, Star, Menu, X, Sparkles, Phone, Mail,
  MapPin, ChevronRight, Zap, Globe,
  BookOpen, Facebook, Instagram, Twitter,
  Moon, Sun, Package, Briefcase, CheckCircle2,
  QrCode, CreditCard, LayoutDashboard, LineChart, GraduationCap,
  ArrowUpRight, BarChart3, ShieldCheck, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { storesApi } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';

// ─── Logo ───────────────────────────────────────────────────────────
const OscorpLogo = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'h-10 sm:h-12', md: 'h-14 sm:h-16', lg: 'h-20 sm:h-24' };
  return (
    <div className={cn('flex items-center', className)}>
      <img src="/oscorp-logo.png" alt="Oscorp" className={cn('w-auto object-contain', sizes[size])} />
    </div>
  );
};

// ─── Navbar ─────────────────────────────────────────────────────────
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg dark:shadow-slate-950/50 py-1'
          : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 sm:py-3'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <Link to="/" className="flex items-center shrink-0">
              <OscorpLogo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-slate-200">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25">
                  Crear Cuenta
                </Button>
              </Link>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white transition-colors"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ Mobile Menu - Full screen overlay ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] md:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />

            {/* Menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <OscorpLogo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-white" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-3.5 px-4 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-medium text-base transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              {/* Bottom actions */}
              <div className="px-5 py-5 space-y-3 border-t border-gray-100 dark:border-slate-800">
                <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-12 text-base font-semibold">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-base font-semibold">
                    Crear Cuenta
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Hero ────────────────────────────────────────────────────────────
const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center mix-blend-overlay opacity-10 dark:opacity-20" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1.5 rounded-full backdrop-blur-md uppercase tracking-[0.2em] font-bold text-[10px]">
              <Sparkles className="w-3 h-3 mr-2" />
              Empresa Paraguaya de Economía Colaborativa
            </Badge>
            <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black text-slate-900 dark:text-white leading-tight mb-8">
              Te conectamos <br />
              con tu <span className="gradient-text italic">Éxito Financiero</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl font-light">
              Entregamos beneficios y soluciones en Educación Financiera, Empresarial e Inversiones. Ayudamos a las personas a generar riqueza con una actitud diferente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-2xl shadow-blue-500/20 group">
                  Saber Más
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/app/tiendas">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-lg font-bold">
                  Ver Marketplace
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 grayscale opacity-70 dark:opacity-50 contrast-125">
              <div className="flex flex-col">
                <span className="text-slate-900 dark:text-white font-black text-2xl leading-none tracking-tighter">OSCORP</span>
                <span className="text-[8px] text-blue-600 dark:text-blue-400 tracking-[0.3em] font-bold">INGENIO EMPRESARIAL</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
              <div className="flex flex-col">
                <span className="text-slate-900 dark:text-white font-black text-xl leading-none tracking-tighter uppercase">IM</span>
                <span className="text-[8px] text-blue-600 dark:text-blue-400 tracking-[0.3em] font-bold uppercase">Ingenio Millonario</span>
              </div>
            </div>
          </motion.div>

          {/* Unified Ecosystem Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-20 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src="/images/brand/ecosystem-full.png"
                alt="Oscorp Ecosystem"
                className="relative z-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 glow-box w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {/* Subtle glass overlay logic can be added here if needed */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-[2.6rem] blur opacity-20 dark:opacity-25 group-hover:opacity-40 transition-opacity" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── Services ───────────────────────────────────────────────────────
const PillarSection = () => {
  const pillars = [
    {
      title: "Fintech Crowdfunding",
      subtitle: "Billetera & Inversiones",
      desc: "Solución integral para pagar con QR, transferir dinero de forma instantánea y participar en proyectos de inversión inteligente.",
      icon: TrendingUp,
      color: "blue",
      items: ["Carga y Pago QR Dinámico", "Transferencias Inmediatas", "Inversiones BVPASA & Crowdfunding"]
    },
    {
      title: "Ecommerce Oscorp-e",
      subtitle: "Centro de Comercio",
      desc: "Plataforma multivendedor para escalar tu negocio. Vende productos y servicios las 24hs a nivel nacional con respaldo corporativo.",
      icon: ShoppingBag,
      color: "violet",
      items: ["Punto de Venta POS", "Tiendas Premium 24/7", "Red Nacional de Vendedores"]
    },
    {
      title: "Educación IM",
      subtitle: "Ingenio Millonario",
      desc: "Desarrolla tu mentalidad de éxito mediante educación financiera premium y herramientas de control de patrimonio personal.",
      icon: GraduationCap,
      color: "cyan",
      items: ["Matriz Financiero", "Metodología 5S", "Mentoría Empresarial"]
    }
  ];

  return (
    <section id="servicios" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <Badge variant="outline" className="mb-4 border-blue-500/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest font-black text-[10px]">¿QUÉ HACEMOS?</Badge>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6">Nuestros Pilares</h2>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 italic">"Ayudamos a las personas para que descubran, desarrollen y aprovechen su ACTITUD para generar RIQUEZA."</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-500 relative group overflow-hidden"
            >
              <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-8 bg-blue-50 dark:bg-white/5 group-hover:bg-blue-600 transition-all duration-300")}>
                <pillar.icon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{pillar.title}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-bold mb-6 text-[10px] uppercase tracking-widest">{pillar.subtitle}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm sm:text-base font-light">{pillar.desc}</p>
              <ul className="space-y-3">
                {pillar.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600/5 rounded-full blur-[60px]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Ecosistema Detallado ───────────────────────────────────────────
const EcosistemaSection = () => {
  const sections = [
    {
      id: "fintech",
      title: "Billetera Digital",
      icon: QrCode,
      color: "from-blue-600 to-indigo-600",
      features: [
        { title: "Pagos QR Instantáneos", desc: "Escanea y paga en segundos en cualquier comercio adherido.", icon: Zap },
        { title: "Cargas y Retiros", desc: "Gestiona tu efectivo de forma digital con total seguridad.", icon: ArrowUpRight },
        { title: "Transferencias", desc: "Envía dinero a otros usuarios de la red Oscorp sin comisiones.", icon: Globe },
        { title: "Préstamos", desc: "Accede a líneas de crédito adaptadas a tu perfil financiero.", icon: ShieldCheck }
      ],
      image: "/images/brand/ecosystem-tablet-phone.png"
    },
    {
      id: "seller",
      title: "Plataforma de Vendedores",
      icon: LayoutDashboard,
      color: "from-violet-600 to-purple-600",
      features: [
        { title: "POS Profesional", desc: "Terminal punto de venta con soporte para códigos de barras.", icon: ShoppingBag },
        { title: "Gestión de Stock", desc: "Control de inventario en tiempo real para productos y servicios.", icon: Package },
        { title: "Ventas a Crédito", desc: "Administra las cuentas corrientes de tus clientes fieles.", icon: CreditCard },
        { title: "Multi-Red", desc: "Tus productos visibles en todo el ecosistema Oscorp-e.", icon: Globe }
      ],
      image: "/images/brand/hero-mockup.png"
    },
    {
      id: "management",
      title: "Inteligencia de Negocios",
      icon: LineChart,
      color: "from-emerald-600 to-teal-600",
      features: [
        { title: "Reportes en Tiempo Real", desc: "Visualiza tus KPIs de ventas, ganancias y comisiones.", icon: BarChart3 },
        { title: "Exportación Profesional", desc: "Genera reportes en PDF, Excel y CSV para tu contabilidad.", icon: FileText },
        { title: "Control Financiero", desc: "Seguimiento automático de ingresos y egresos del negocio.", icon: TrendingUp },
        { title: "Gestión de Proveedores", desc: "Mantén ordenado tu historial de compras y suministros.", icon: Users }
      ],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026"
    }
  ];

  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <Badge className="mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-black text-[10px] tracking-widest uppercase">Ecosistema Oscorp</Badge>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Soluciones 360° para tu <span className="gradient-text italic">Crecimiento</span></h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-light">
            No solo somos una plataforma, somos una red integrada de servicios diseñados para potenciar cada aspecto de tu vida financiera y empresarial.
          </p>
        </div>

        <div className="space-y-32">
          {sections.map((section, idx) => (
            <div key={section.id} className={cn(
              "flex flex-col lg:flex-row items-center gap-16 lg:gap-24",
              idx % 2 !== 0 && "lg:flex-row-reverse"
            )}>
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 space-y-10"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl", section.color)}>
                    <section.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{section.title}</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  {section.features.map((feat, fidx) => (
                    <div key={fidx} className="space-y-2 group">
                      <div className="flex items-center gap-3">
                        <feat.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{feat.title}</h4>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-light">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <Link to="/register">
                  <Button className="h-14 px-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold group mt-4">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>

              {/* Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: idx % 2 === 0 ? 5 : -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                className="flex-1 relative"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 blur-[100px] rounded-full", section.color)} />
                <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl glow-box">
                  <img src={section.image} alt={section.title} className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Marketplace ────────────────────────────────────────────────────
interface StoreData {
  id: string;
  name: string;
  slug: string;
  banner?: string;
  logo?: string;
  category?: string;
  productCount?: number;
  rating?: number | string;
}

const MarketplaceSection = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await storesApi.getAll();
        setStores(data.slice(0, 4)); // Show first 4 stores
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const categories = [
    { name: 'Tecnología', icon: Zap, count: '1.2K' },
    { name: 'Moda', icon: ShoppingBag, count: '3.5K' },
    { name: 'Hogar', icon: Store, count: '890' },
    { name: 'Deportes', icon: TrendingUp, count: '650' },
    { name: 'Educación', icon: BookOpen, count: '420' },
    { name: 'Servicios', icon: Globe, count: '280' },
  ];

  return (
    <section id="marketplace" className="py-16 sm:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-semibold text-xs">
            <Store className="w-3 h-3 mr-1.5" />
            COMMERCE CENTER
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Eleva tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600 dark:from-emerald-400 dark:to-blue-400">
              Presencia
            </span>
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            Marketplace multivendedor con tecnología de punta para escalar tu negocio sin límites.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 mb-12 sm:mb-20">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center cursor-pointer border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-400/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <cat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white mb-0.5 text-xs sm:text-sm">{cat.name}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{cat.count}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Stores */}
        <div className="mb-12 sm:mb-20">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">Marcas de Éxito</h3>
              <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full" />
            </div>
            <Link to="/app/tiendas">
              <Button variant="link" className="text-blue-600 dark:text-blue-400 p-0 text-sm sm:text-base font-bold group">
                Ver Todas
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl sm:rounded-3xl h-64 animate-pulse" />
              ))
            ) : (
              stores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-white/5 group"
                >
                  <Link to={`/tienda/${store.slug}`}>
                    <div className={cn('h-24 sm:h-36 lg:h-44 relative bg-gradient-to-br from-blue-600 to-indigo-600')}>
                      {store.banner ? (
                        <img src={store.banner} className="w-full h-full object-cover" alt={store.name} />
                      ) : (
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                      )}
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-none font-bold backdrop-blur-md text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                          {store.category || 'General'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                          {store.logo ? (
                            <img src={store.logo} className="w-full h-full rounded-lg object-cover" alt={store.name} />
                          ) : (
                            <Package className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-5">
                      <h4 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center truncate">{store.name}</h4>
                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold">
                          <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                          {store.productCount || 0}
                        </div>
                        <div className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                          {store.rating || '5.0'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-slate-900 dark:bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden shadow-2xl"
        >
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-violet-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 sm:mb-6 text-white dark:text-slate-950">
              ¿Listo para el{' '}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 dark:from-blue-600 dark:to-violet-600">
                Siguiente Nivel?
              </span>
            </h3>
            <p className="text-sm sm:text-lg text-slate-300 dark:text-slate-600 mb-6 sm:mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Únete a la plataforma que está redefiniendo el comercio paraguayo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 bg-white dark:bg-slate-950 text-slate-950 dark:text-white hover:opacity-90 rounded-full text-base font-bold">
                  Crear Mi Tienda
                  <Store className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 border-white/20 dark:border-slate-900/20 text-white dark:text-slate-950 hover:bg-white/10 dark:hover:bg-slate-900/5 rounded-full text-base font-bold">
                  Panel de Vendedor
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── About ──────────────────────────────────────────────────────────
const AboutSection = () => (
  <section id="nosotros" className="py-32 bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/10 glow-box">
            <img src="/images/brand/education-concept.png" className="w-full h-[500px] object-cover opacity-80 dark:opacity-60" alt="Team" />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10">
              <p className="text-3xl font-black text-slate-900 dark:text-white italic leading-tight">"Apoyamos los sueños de las personas."</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">NUESTRO PROPÓSITO</Badge>
          <h2 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8">Te motivamos a <br /><span className="gradient-text">soñar en grande</span></h2>
          <div className="space-y-6 text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
            <p>Apoyamos los sueños de las personas que quieran dar significado a sus vidas para que se conviertan en su YO más grande. Te motivamos a que sueñes en grande, a que lo hagas de una manera diferente y a que superes los obstáculos de TU propia vida.</p>
            <p>Nosotros sabemos que puedes y el proceso para hacerlo te dará gran felicidad.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            {['Ingenio', 'Integridad', 'Liderazgo', 'Innovación'].map((v) => (
              <div key={v} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center shadow-sm">
                <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── Testimonials ───────────────────────────────────────────────────
const TestimonialsSection = () => {
  const testimonials = [
    { name: 'María González', role: 'Emprendedora', content: 'Oscorp transformó mi negocio. Ahora vendo a todo el país y mis ingresos crecieron un 300%. La plataforma es increíblemente fácil de usar.', rating: 5 },
    { name: 'Carlos Martínez', role: 'Vendedor Profesional', content: 'La billetera digital es increíble. Puedo pagar en cualquier tienda con solo escanear mi QR. Las transferencias son instantáneas.', rating: 5 },
    { name: 'Ana Rodríguez', role: 'Estudiante de Finanzas', content: 'Los cursos de Ingenio Millonario cambiaron mi vida. Ahora tengo control total de mis finanzas y estoy construyendo mi patrimonio.', rating: 5 },
  ];

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-none font-bold text-xs">
            <Star className="w-3 h-3 mr-1.5" />
            TESTIMONIOS
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Confianza de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Primer Nivel
            </span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex gap-0.5 mb-3 sm:mb-5">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-5 sm:mb-6 italic text-sm sm:text-base leading-relaxed">"{t.content}"</p>
              <div className="flex items-center gap-3 pt-4 sm:pt-5 border-t border-slate-100 dark:border-white/5">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`}
                  alt={t.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-500/20"
                />
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Contact ────────────────────────────────────────────────────────
const ContactSection = () => (
  <section id="contacto" className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-slate-900 transition-colors duration-500 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px]" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 sm:mb-6 py-1 px-3 bg-blue-100 dark:bg-white/5 text-blue-600 dark:text-white border-blue-200 dark:border-white/10 font-bold text-xs uppercase tracking-widest">
            CONEXIÓN GLOBAL
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight">
            Liderazgo en <span className="italic">Acción</span>
          </h2>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 font-light leading-relaxed">
            Estamos listos para potenciar tu visión corporativa. Contacta con nuestro equipo de expertos.
          </p>

          <div className="space-y-5 sm:space-y-6">
            {[
              { icon: Phone, label: 'Línea Directa', value: '0972 540 579 / 0975 675 844', hoverColor: 'group-hover:bg-blue-600' },
              { icon: Mail, label: 'Consultas', value: 'info@oscorp.com.py', hoverColor: 'group-hover:bg-blue-700' },
              { icon: MapPin, label: 'Sede Central', value: 'Coronel Bogado, Itapúa', hoverColor: 'group-hover:bg-blue-800' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 group">
                <div className={cn('w-11 h-11 sm:w-12 sm:h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 transition-colors duration-300 shrink-0', item.hoverColor)}>
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-slate-200 dark:border-white/10 shadow-2xl"
        >
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-5 sm:mb-6">Envíanos un mensaje</h3>
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">NOMBRE</label>
                <input type="text" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">EMAIL</label>
                <input type="email" placeholder="tu@email.com" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">ASUNTO</label>
              <input type="text" placeholder="Propósito de tu mensaje" className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-[8px]">MENSAJE</label>
              <textarea placeholder="Describe tu consulta..." rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm" />
            </div>
            <Button className="w-full h-12 bg-blue-600 dark:bg-white text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-slate-200 rounded-full font-black text-sm sm:text-base shadow-xl">
              ENVIAR MENSAJE
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  </section>
);

// ─── Footer ─────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-20 border-t border-slate-200 dark:border-white/5 transition-colors duration-500">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <BrandLogo size="lg" variant="auto" />
          <p className="text-slate-600 dark:text-slate-500 leading-relaxed font-light">
            Entregamos Beneficios y Soluciones en Educación Financiera, Empresarial e Inversiones en Paraguay.
          </p>
        </div>
        <div>
          <h4 className="font-black mb-6 text-sm uppercase tracking-widest text-slate-900 dark:text-white">Plataforma</h4>
          <ul className="space-y-4 text-slate-600 dark:text-slate-400">
            <li><Link to="/app/tiendas" className="hover:text-blue-600 transition-colors">Ecommerce OSCORP-e</Link></li>
            <li><Link to="/ingenio" className="hover:text-blue-600 transition-colors">Ingenio Millonario</Link></li>
            <li><Link to="/wallet" className="hover:text-blue-600 transition-colors">Fintech Crowdfunding</Link></li>
            <li><Link to="/app/productos" className="hover:text-blue-600 transition-colors">Marketplace</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-black mb-6 text-sm uppercase tracking-widest text-slate-900 dark:text-white">Compañía</h4>
          <ul className="space-y-4 text-slate-600 dark:text-slate-400">
            <li><a href="#nosotros" className="hover:text-blue-600 transition-colors">Propósito</a></li>
            <li><a href="#servicios" className="hover:text-blue-600 transition-colors">Nuestros Pilares</a></li>
            <li><a href="#marketplace" className="hover:text-blue-600 transition-colors">Tiendas Premium</a></li>
            <li><a href="#contacto" className="hover:text-blue-600 transition-colors">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-black mb-6 text-sm uppercase tracking-widest text-slate-900 dark:text-white">Contacto</h4>
          <ul className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-blue-600" /> Coronel Bogado, Itapúa</li>
            <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-blue-600" /> +595 ...</li>
            <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-600" /> info@oscorp.com.py</li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-slate-500 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Oscorp - Ingenio Empresarial. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          {[Facebook, Instagram, Twitter].map((Icon, i) => (
            <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-slate-600 dark:text-white">
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── Main ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <PillarSection />
      <EcosistemaSection />
      <MarketplaceSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
      <InstallPrompt />
    </div>
  );
}
