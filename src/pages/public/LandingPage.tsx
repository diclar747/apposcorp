import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, TrendingUp, ShoppingBag, GraduationCap, Wallet, QrCode,
  Users, Store, Star, CheckCircle, Menu, X, Sparkles, Phone, Mail,
  MapPin, ChevronRight, Shield, Zap, Globe, CreditCard, BarChart3,
  BookOpen, Facebook, Instagram, Twitter, Linkedin, Moon, Sun, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

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
const HeroSection = () => (
  <section id="inicio" className="relative min-h-[100dvh] sm:min-h-screen flex items-center overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.15] mix-blend-overlay" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-20">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Badge className="mb-4 sm:mb-6 py-1 sm:py-1.5 px-3 sm:px-4 bg-white/50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-400/20 backdrop-blur-xl shadow-sm text-[10px] sm:text-xs">
            <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" />
            <span className="tracking-wide font-medium">ECONOMÍA COLABORATIVA V2.0</span>
          </Badge>

          <h1 className="text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-4 sm:mb-8">
            Somos una Empresa{' '}
            <span className="sm:block">Paraguaya </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-400">
              Economía Colaborativa
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-10 max-w-lg leading-relaxed font-light">
            Entregamos Beneficios y Soluciones en Educación Financiera, Empresarial e Inversiones
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 rounded-full text-base font-semibold shadow-2xl shadow-blue-500/20">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/app/tiendas" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-base font-medium backdrop-blur-md">
                Explorar Marketplace
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-10 mt-8 sm:mt-12">
            {[
              { value: '50K+', label: 'Usuarios' },
              { value: '500+', label: 'Tiendas' },
              { value: '₲2B+', label: 'Transacciones' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-3xl blur-2xl opacity-30" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <img src="/images/fiat-fintech.png" alt="Oscorp Platform" className="rounded-2xl w-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block"
    >
      <div className="w-6 h-10 border-2 border-slate-300/50 dark:border-white/30 rounded-full flex justify-center pt-2">
        <div className="w-1.5 h-3 bg-slate-400/50 dark:bg-white/50 rounded-full" />
      </div>
    </motion.div>
  </section>
);

// ─── Services ───────────────────────────────────────────────────────
const ServicesSection = () => {
  const services = [
    {
      icon: TrendingUp,
      title: 'Ingenio Millonario',
      description: 'Curso especializado en Educación Financiera (Aula Invertida). Creamos la app IM/Matriz Financiera. Convenios con Universidades, Municipios y el MEC.',
      color: 'from-blue-500 to-blue-600',
      features: ['Matriz Financiera', 'Gestión de Activos', 'Proyecciones', 'Certificación'],
      link: '/ingenio'
    },
    {
      icon: Wallet,
      title: 'Fintech OSCORP-i',
      description: 'Plataforma de Crowdfunding para inversiones. Conectamos personas que necesitan capital con inversores. Aliados: CADIEM, INVESTOR, BVPASA.',
      color: 'from-violet-500 to-violet-600',
      features: ['Crowdfunding', 'Inversiones', 'Wallet Digital', 'Pagos QR'],
      link: '/wallet'
    },
    {
      icon: ShoppingBag,
      title: 'E-Commerce OSCORP-e',
      description: 'Plataforma de Comercio Electrónico para venta de productos y servicios las 24hs a nivel nacional. Asesoramiento integral a microempresas.',
      color: 'from-emerald-500 to-emerald-600',
      features: ['Tienda Propia', 'Pagos Integrados', 'Gestión de Stock', 'Analytics'],
      link: '/app/tiendas'
    }
  ];

  return (
    <section id="servicios" className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-none font-semibold text-xs">
            SERVICIOS EXCLUSIVOS
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Ecosistema de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Alto Impacto
            </span>
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            Tres pilares fundamentales diseñados para la nueva era de la economía digital en Paraguay.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 transition-all duration-500 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20 hover:shadow-xl group-hover:-translate-y-1">
                <div className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 shadow-lg transition-transform duration-500 group-hover:scale-110',
                  'bg-gradient-to-br', service.color
                )}>
                  <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{service.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-5 sm:mb-8 leading-relaxed">{service.description}</p>

                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={service.link}>
                  <Button variant="ghost" className="w-full h-11 sm:h-12 rounded-xl group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-300 border border-slate-200 dark:border-white/10 dark:text-white text-sm">
                    Saber Más
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Marketplace ────────────────────────────────────────────────────
const MarketplaceSection = () => {
  const categories = [
    { name: 'Tecnología', icon: Zap, count: '1.2K' },
    { name: 'Moda', icon: ShoppingBag, count: '3.5K' },
    { name: 'Hogar', icon: Store, count: '890' },
    { name: 'Deportes', icon: TrendingUp, count: '650' },
    { name: 'Educación', icon: BookOpen, count: '420' },
    { name: 'Servicios', icon: Globe, count: '280' },
  ];

  const featuredStores = [
    { name: 'TechPlus', category: 'Tecnología', products: 234, rating: 4.8, gradient: 'from-blue-600 to-cyan-500' },
    { name: 'Moda Express', category: 'Ropa y Moda', products: 567, rating: 4.6, gradient: 'from-pink-500 to-rose-500' },
    { name: 'Hogar Perfecto', category: 'Hogar', products: 189, rating: 4.9, gradient: 'from-emerald-500 to-teal-500' },
    { name: 'Deportes Pro', category: 'Deportes', products: 345, rating: 4.7, gradient: 'from-orange-500 to-amber-500' },
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
            {featuredStores.map((store, index) => (
              <motion.div
                key={store.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-white/5 group"
              >
                <div className={cn('h-24 sm:h-36 lg:h-44 relative bg-gradient-to-br', store.gradient)}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-none font-bold backdrop-blur-md text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                      {store.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                      <Package className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-5">
                  <h4 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">{store.name}</h4>
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold">
                      <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                      {store.products}
                    </div>
                    <div className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                      {store.rating}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
  <section id="nosotros" className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-slate-950 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 sm:mb-6 py-1 px-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold text-xs">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            NUESTRA ESENCIA
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-4 sm:mb-8">
            Ingenio{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Empresarial
            </span>
          </h2>

          <div className="space-y-4 sm:space-y-6 text-sm sm:text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-6 sm:mb-10">
            <p>
              Somos una empresa de <span className="font-medium text-slate-900 dark:text-white">economía colaborativa</span>.
              Ayudamos a las personas para que descubran, desarrollen y aprovechen su ACTITUD para generar RIQUEZA.
            </p>
            <blockquote className="border-l-4 border-blue-600 pl-4 sm:pl-6 italic text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 py-4 sm:py-5 pr-4 rounded-r-xl sm:rounded-r-2xl text-sm sm:text-lg">
              "Desafiamos el cambio, la zona de confort, la crisis y los problemas al CREER, CREAR y CRECER de una forma diferente."
            </blockquote>
            <p>
              Apoyamos los sueños de las personas que quieran dar significado a sus vidas para que se conviertan en su YO más grande.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Ingenio', 'Integridad', 'Liderazgo', 'Innovación', 'Creatividad', 'Conocimiento', 'Emprendimiento'].map((value) => (
              <Badge key={value} variant="secondary" className="text-xs py-1 px-2.5">{value}</Badge>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/10 to-violet-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="relative grid grid-cols-2 gap-3 sm:gap-5">
            <img
              src="https://images.unsplash.com/photo-1522071823991-b9671f9d7f1f?w=800"
              alt="Oscorp Education"
              className="rounded-2xl sm:rounded-3xl shadow-2xl w-full h-44 sm:h-72 lg:h-[28rem] object-cover"
            />
            <div className="pt-6 sm:pt-10">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"
                alt="Oscorp Business"
                className="rounded-2xl sm:rounded-3xl shadow-2xl w-full h-44 sm:h-72 lg:h-[28rem] object-cover"
              />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">100%</p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Nacional</p>
            </div>
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
  <section id="contacto" className="py-16 sm:py-24 lg:py-32 bg-slate-900 overflow-hidden relative">
    <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-4 sm:mb-6 py-1 px-3 bg-white/5 text-white border-white/10 font-bold text-xs">
            CONEXIÓN GLOBAL
          </Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6">
            Liderazgo en <span className="italic">Acción</span>
          </h2>
          <p className="text-sm sm:text-lg text-slate-400 mb-8 sm:mb-10 font-light leading-relaxed">
            Estamos listos para potenciar tu visión corporativa. Contacta con nuestro equipo de expertos.
          </p>

          <div className="space-y-5 sm:space-y-6">
            {[
              { icon: Phone, label: 'Línea Directa', value: '0972 540 579 / 0975 675 844', hoverColor: 'group-hover:bg-blue-600' },
              { icon: Mail, label: 'Consultas', value: 'info@oscorp.com.py', hoverColor: 'group-hover:bg-violet-600' },
              { icon: MapPin, label: 'Sede Central', value: 'Coronel Bogado, Itapúa', hoverColor: 'group-hover:bg-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 group">
                <div className={cn('w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 transition-colors duration-300 shrink-0', item.hoverColor)}>
                  <item.icon className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm sm:text-base font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-white/10 shadow-2xl"
        >
          <h3 className="text-lg sm:text-xl font-black text-white mb-5 sm:mb-6">Contacto</h3>
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NOMBRE</label>
                <input type="text" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">EMAIL</label>
                <input type="email" placeholder="tu@email.com" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ASUNTO</label>
              <input type="text" placeholder="Propósito de tu mensaje" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MENSAJE</label>
              <textarea placeholder="Describe tu consulta..." rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm" />
            </div>
            <Button className="w-full h-12 bg-white text-slate-950 hover:bg-slate-200 rounded-full font-black text-sm sm:text-base shadow-xl">
              ENVIAR
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
  <footer className="bg-slate-950 text-white py-10 sm:py-14">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-10">
        <div className="col-span-2 md:col-span-1">
          <OscorpLogo className="mb-3" size="sm" />
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Plataforma integral de economía colaborativa en Paraguay.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Plataforma</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
            <li><Link to="/app/tiendas" className="hover:text-white transition-colors">Tienda</Link></li>
            <li><Link to="/app/cursos" className="hover:text-white transition-colors">Cursos</Link></li>
            <li><Link to="/app/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
            <li><Link to="/app/ingenio" className="hover:text-white transition-colors">Ingenio Millonario</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Empresa</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
            <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
            <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
            <li><a href="#marketplace" className="hover:text-white transition-colors">Marketplace</a></li>
            <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-xs sm:text-sm">
          © {new Date().getFullYear()} Oscorp - Ingenio Empresarial
        </p>
        <div className="flex gap-3">
          {[
            { icon: Facebook, color: 'hover:bg-blue-600' },
            { icon: Instagram, color: 'hover:bg-pink-600' },
            { icon: Twitter, color: 'hover:bg-sky-500' },
            { icon: Linkedin, color: 'hover:bg-blue-700' },
          ].map(({ icon: Icon, color }, i) => (
            <a key={i} href="#" className={cn('w-9 h-9 bg-white/10 rounded-full flex items-center justify-center transition-colors', color)}>
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <MarketplaceSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <InstallPrompt />
    </div>
  );
}
