import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  GraduationCap,
  Wallet,
  QrCode,
  Users,
  Store,
  Star,
  CheckCircle,
  Menu,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Play,
  Shield,
  Zap,
  Globe,
  CreditCard,
  BarChart3,
  BookOpen,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockStores } from '@/data/mockData';
import { useThemeStore } from '@/stores/themeStore';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

// Oscorp Logo Component
const OscorpLogo = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizes = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32'
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <img
        src="/oscorp-logo.png"
        alt="Oscorp"
        className={cn('w-auto object-contain', sizes[size])}
      />
    </div>
  );
};

// Navigation
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg dark:shadow-slate-950/50 py-1 sm:py-2'
        : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg md:bg-transparent md:dark:bg-transparent py-2 sm:py-4'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16">
          <Link to="/" className="flex items-center">
            <OscorpLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isScrolled
                    ? "text-gray-700 dark:text-slate-200 hover:text-blue-600"
                    : "text-slate-700 dark:text-white/90 hover:text-blue-600 dark:hover:text-white"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-full transition-all duration-300",
                isScrolled
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                  : "bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 backdrop-blur-md"
              )}
              title="Alternar tema"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" className={cn(
                "transition-colors duration-300",
                isScrolled
                  ? "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  : "text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
              )}>
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className={cn(
                "bg-gradient-to-r hover:opacity-90 transition-opacity",
                isScrolled
                  ? "from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-900 dark:bg-white text-white dark:text-blue-900 hover:bg-slate-800 dark:hover:bg-white/90"
              )}>
                Crear Cuenta
              </Button>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="p-2 rounded-lg transition-colors bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-2xl"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-3 px-3 rounded-xl text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 pb-1 space-y-2 border-t border-gray-100 dark:border-slate-800 mt-2">
                <Link to="/login" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-gray-900 dark:text-white h-11">Iniciar Sesión</Button>
                </Link>
                <Link to="/register" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white h-11">Crear Cuenta</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section id="inicio" className="relative min-h-[85vh] sm:min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-700">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.15] mix-blend-overlay" />

        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 sm:mb-8 py-1 sm:py-1.5 px-3 sm:px-4 bg-white/50 dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-400/20 backdrop-blur-xl shadow-sm text-xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 animate-pulse" />
                <span className="tracking-wide font-medium">ECONOMÍA COLABORATIVA V2.0</span>
              </Badge>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-4 sm:mb-8">
              Somos una Empresa{' '}
              <span className="sm:block">Paraguaya </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-400">Economía Colaborativa</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-10 max-w-lg leading-relaxed font-light">
              Entregamos Beneficios y Soluciones en Educación Financiera, Empresarial e Inversiones
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all rounded-full text-base sm:text-lg font-semibold shadow-2xl shadow-blue-500/20">
                  Comenzar Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/app/tiendas" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all rounded-full text-base sm:text-lg font-medium backdrop-blur-md">
                  Explorar Marketplace
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8 mt-8 sm:mt-12">
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
                <img
                  src="/images/fiat-fintech.png"
                  alt="Oscorp Platform"
                  className="rounded-2xl w-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <div className="w-6 h-10 border-2 border-slate-300/50 dark:border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-slate-400/50 dark:bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

// Services Section
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
    <section id="servicios" className="py-16 sm:py-32 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-20"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 sm:px-4 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-none font-semibold text-xs">
            SERVICIOS EXCLUSIVOS
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Ecosistema de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">Alto Impacto</span>
          </h2>
          <p className="text-sm sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            Tres pilares fundamentales diseñados para la nueva era de la economía digital en Paraguay.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-10">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] group-hover:-translate-y-2">
                <div className={cn(
                  'w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-8 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3',
                  'bg-gradient-to-br',
                  service.color
                )}>
                  <service.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{service.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-8 leading-relaxed">{service.description}</p>

                <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-10">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={service.link}>
                  <Button variant="ghost" className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-300 border border-slate-200 dark:border-white/10 dark:text-white text-sm">
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

// Marketplace Section
const MarketplaceSection = () => {
  const stores = [
    { name: 'TechPlus', category: 'Tecnología', products: 234, rating: 4.8, image: '/images/marketplace.jpg' },
    { name: 'Moda Express', category: 'Ropa y Moda', products: 567, rating: 4.6, image: '/images/hero-business.jpg' },
    { name: 'Hogar Perfecto', category: 'Hogar', products: 189, rating: 4.9, image: '/images/education.jpg' },
    { name: 'Deportes Pro', category: 'Deportes', products: 345, rating: 4.7, image: '/images/fiat-fintech.png' },
  ];

  const categories = [
    { name: 'Tecnología', icon: Zap, count: 1200 },
    { name: 'Moda', icon: ShoppingBag, count: 3500 },
    { name: 'Hogar', icon: Store, count: 890 },
    { name: 'Deportes', icon: TrendingUp, count: 650 },
    { name: 'Educación', icon: BookOpen, count: 420 },
    { name: 'Servicios', icon: Globe, count: 280 },
  ];

  return (
    <section id="marketplace" className="py-16 sm:py-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-20"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 sm:px-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-semibold text-xs">
            <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
            COMMERCE CENTER
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Eleva tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600 dark:from-emerald-400 dark:to-blue-400">Presencia</span>
          </h2>
          <p className="text-sm sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            Marketplace multivendedor con tecnología de punta para escalar tu negocio sin límites.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5 mb-12 sm:mb-24">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center cursor-pointer border border-slate-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 dark:bg-blue-400/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 transition-transform">
                <cat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1 text-xs sm:text-base">{cat.name}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">{cat.count}</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Stores */}
        <div className="mb-12 sm:mb-20">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">Marcas de Éxito</h3>
              <div className="h-1 sm:h-1.5 w-16 sm:w-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full" />
            </div>
            <Link to="/app/tiendas">
              <Button variant="link" className="text-blue-600 dark:text-blue-400 p-0 text-sm sm:text-lg font-bold group">
                Ver Todas
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {mockStores.slice(0, 4).map((store, index) => (
              <Link key={store.id} to={`/tienda/${store.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-white/5 group h-full flex flex-col"
                >
                  <div className="h-28 sm:h-48 relative overflow-hidden">
                    {store.banner ? (
                      <img src={store.banner} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-600" />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                      <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-none font-bold backdrop-blur-md text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                        {store.category || 'Luxury'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-sm sm:text-xl text-slate-900 dark:text-white mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{store.name}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-4 leading-relaxed font-light hidden sm:block">{store.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] sm:text-sm font-bold text-blue-600 dark:text-blue-400">{store.products.length}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-base">{store.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-slate-900 dark:bg-white rounded-2xl sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029')] bg-cover opacity-10 mix-blend-overlay" />
          <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-violet-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-8 text-white dark:text-slate-950">
              ¿Listo para el <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 dark:from-blue-600 dark:to-violet-600">Siguiente Nivel?</span>
            </h3>
            <p className="text-sm sm:text-xl text-slate-300 dark:text-slate-600 mb-6 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Únete a la plataforma que está redefiniendo el comercio paraguayo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 bg-white dark:bg-slate-950 text-slate-950 dark:text-white hover:opacity-90 rounded-full text-base sm:text-lg font-bold">
                  Crear Mi Tienda
                  <Store className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/seller/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 border-white/20 dark:border-slate-900/20 text-white dark:text-slate-950 hover:bg-white/10 dark:hover:bg-slate-900/5 rounded-full text-base sm:text-lg font-bold backdrop-blur-md">
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

// About Section
const AboutSection = () => {
  return (
    <section id="nosotros" className="py-16 sm:py-32 bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 sm:mb-6 py-1 sm:py-1.5 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold text-xs">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              NUESTRA ESENCIA
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 sm:mb-8">
              Ingenio <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">Empresarial</span>
            </h2>

            <div className="space-y-4 sm:space-y-6 text-sm sm:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-6 sm:mb-10">
              <p>
                Somos una empresa de <span className="font-medium text-slate-900 dark:text-white">economía colaborativa</span>.
                Ayudamos a las personas para que descubran, desarrollen y aprovechen su ACTITUD para generar RIQUEZA.
              </p>

              <blockquote className="border-l-4 border-blue-600 pl-4 sm:pl-8 italic text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 py-4 sm:py-6 rounded-r-2xl sm:rounded-r-3xl text-sm sm:text-xl">
                "Desafiamos el cambio, la zona de confort, la crisis y los problemas al CREER de una forma diferente, CREAR de una forma diferente, y CRECER de una forma diferente."
              </blockquote>

              <p>
                Apoyamos los sueños de las personas que quieran dar significado a sus vidas para que se conviertan en su YO más grande.
              </p>
            </div>

            {/* Values */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {['Ingenio', 'Integridad', 'Liderazgo', 'Innovación', 'Creatividad', 'Conocimiento', 'Emprendimiento'].map((value) => (
                <Badge key={value} variant="secondary" className="text-xs sm:text-sm py-0.5 sm:py-1 px-2 sm:px-3">
                  {value}
                </Badge>
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
            <div className="relative grid grid-cols-2 gap-3 sm:gap-6">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1522071823991-b9671f9d7f1f?w=800"
                  alt="Oscorp Education"
                  className="rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full h-48 sm:h-[32rem] object-cover transition-transform hover:scale-[1.02]"
                />
              </div>
              <div className="pt-6 sm:pt-12">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"
                  alt="Oscorp Business"
                  className="rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full h-48 sm:h-[32rem] object-cover transition-transform hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 backdrop-blur-xl">
              <div className="text-center">
                <p className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">100%</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Nacional</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'María González',
      role: 'Emprendedora',
      image: '/images/testimonial-1.jpg',
      content: 'Oscorp transformó mi negocio. Ahora vendo a todo el país y mis ingresos crecieron un 300%. La plataforma es increíblemente fácil de usar.',
      rating: 5
    },
    {
      name: 'Carlos Martínez',
      role: 'Vendedor Profesional',
      image: '/images/testimonial-2.jpg',
      content: 'La billetera digital es increíble. Puedo pagar en cualquier tienda con solo escanear mi QR. Las transferencias son instantáneas.',
      rating: 5
    },
    {
      name: 'Ana Rodríguez',
      role: 'Estudiante de Finanzas',
      image: '/images/testimonial-3.jpg',
      content: 'Los cursos de Ingenio Millonario cambiaron mi vida. Ahora tengo control total de mis finanzas y estoy construyendo mi patrimonio.',
      rating: 5
    }
  ];

  return (
    <section className="py-16 sm:py-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-20"
        >
          <Badge className="mb-3 sm:mb-4 py-1 px-3 sm:px-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-none font-bold text-xs">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
            TESTIMONIOS
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-3 sm:mb-6">
            Confianza de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">Primer Nivel</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-0.5 sm:gap-1 mb-3 sm:mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4 sm:mb-8 italic text-sm sm:text-lg leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">"{testimonial.content}"</p>
              <div className="flex items-center gap-3 sm:gap-5 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`}
                  alt={testimonial.name}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-blue-500/20"
                />
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base">{testimonial.name}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  return (
    <section id="contacto" className="py-16 sm:py-32 bg-slate-900 transition-colors duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 sm:mb-6 py-1 sm:py-1.5 px-3 sm:px-4 bg-white/5 text-white border-white/10 font-bold text-xs">
              CONEXIÓN GLOBAL
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-8">
              Liderazgo en <span className="italic">Acción</span>
            </h2>
            <p className="text-sm sm:text-xl text-slate-400 mb-8 sm:mb-12 font-light leading-relaxed">
              Estamos listos para potenciar tu visión corporativa. Contacta con nuestro equipo de expertos.
            </p>

            <div className="space-y-5 sm:space-y-8">
              <div className="flex items-center gap-4 sm:gap-6 group">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-blue-600 transition-colors duration-500 shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Línea Directa</p>
                  <p className="text-sm sm:text-lg font-bold text-white tracking-wide">0972 540 579 / 0975 675 844</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 group">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-violet-600 transition-colors duration-500 shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Consultas</p>
                  <p className="text-sm sm:text-lg font-bold text-white tracking-wide">info@oscorp.com.py</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 group">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-emerald-600 transition-colors duration-500 shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Sede Central</p>
                  <p className="text-sm sm:text-lg font-bold text-white tracking-wide">Coronel Bogado, Itapúa</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 border border-white/10 shadow-2xl"
          >
            <h3 className="text-lg sm:text-2xl font-black text-white mb-4 sm:mb-8">Contacto</h3>
            <form className="space-y-4 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NOMBRE</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">EMAIL</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ASUNTO</label>
                <input
                  type="text"
                  placeholder="Propósito de tu mensaje"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">MENSAJE</label>
                <textarea
                  placeholder="Describe tu consulta..."
                  rows={3}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm sm:text-base"
                />
              </div>
              <Button className="w-full h-11 sm:h-14 bg-white text-slate-950 hover:bg-slate-200 transition-all rounded-full font-black text-sm sm:text-lg shadow-xl shadow-white/5">
                ENVIAR
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="col-span-2 md:col-span-1">
            <OscorpLogo className="mb-4" size="sm" />
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Plataforma integral de economía colaborativa en Paraguay.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Plataforma</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
              <li><Link to="/app/tienda" className="hover:text-white transition-colors">Tienda</Link></li>
              <li><Link to="/app/cursos" className="hover:text-white transition-colors">Cursos</Link></li>
              <li><Link to="/app/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
              <li><Link to="/app/ingenio" className="hover:text-white transition-colors">Ingenio Millonario</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Empresa</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#marketplace" className="hover:text-white transition-colors">Marketplace</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Oscorp - Ingenio Empresarial
          </p>
          <div className="flex gap-3 sm:gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page
export default function LandingPage() {
  return (
    <div className="min-h-screen">
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
