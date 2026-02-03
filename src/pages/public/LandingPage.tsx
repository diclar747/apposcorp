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
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Oscorp Logo Component
const OscorpLogo = ({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20'
  };
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg 
        viewBox="0 0 200 60" 
        className={cn('w-auto', sizes[size])}
      >
        {/* Circular Icon with bars */}
        <circle cx="28" cy="30" r="24" fill="none" stroke="#3b82f6" strokeWidth="2.5"/>
        <circle cx="28" cy="30" r="19" fill="none" stroke="#3b82f6" strokeWidth="1"/>
        {/* Bar chart icon inside */}
        <rect x="20" y="22" width="5" height="16" fill="#3b82f6" rx="1"/>
        <rect x="27" y="18" width="5" height="20" fill="#3b82f6" rx="1"/>
        <rect x="34" y="26" width="5" height="12" fill="#3b82f6" rx="1"/>
        {/* OSCORP Text */}
        <text x="58" y="38" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#1e3a5f">
          OSCORP
        </text>
      </svg>
      <span className="text-[9px] tracking-[0.25em] text-gray-500 font-medium mt-0.5">
        INGENIO EMPRESARIAL
      </span>
    </div>
  );
};

// Navigation
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <OscorpLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-700">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                Crear Cuenta
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a 
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Link to="/login" className="block w-full">
                  <Button variant="outline" className="w-full">Iniciar Sesión</Button>
                </Link>
                <Link to="/register" className="block w-full">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600">Crear Cuenta</Button>
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
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900">
        <div className="absolute inset-0 bg-[url('/images/hero-business.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40" />
      </div>

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            rotate: [0, 180, 360] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 60, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Globe className="w-3 h-3 mr-1" />
              Empresa Paraguaya - Economía Colaborativa
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Éxito</span>
              <br />Comienza Aquí
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-lg">
              Plataforma integral de comercio, educación financiera y pagos digitales. 
              Conectamos personas, negocios y oportunidades.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-lg px-8">
                  Comenzar Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/app/tienda">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
                  Explorar Tienda
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12">
              {[
                { value: '50K+', label: 'Usuarios' },
                { value: '500+', label: 'Tiendas' },
                { value: '₲2B+', label: 'Transacciones' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
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
                  src="/images/fintech-concept.jpg" 
                  alt="Oscorp Platform" 
                  className="rounded-2xl w-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
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
      description: 'Curso especializado en Educación Financiera. Aprende a gestionar tus finanzas personales y empresariales con nuestra metodología de Aula Invertida.',
      color: 'from-blue-500 to-blue-600',
      features: ['Matriz Financiera', 'Gestión de Activos', 'Proyecciones', 'Certificación'],
      link: '/ingenio'
    },
    {
      icon: Wallet,
      title: 'Fintech OSCORP-i',
      description: 'Plataforma de Crowdfunding para inversiones. Conectamos personas que necesitan capital con aquellos que pueden otorgarlo de forma segura.',
      color: 'from-violet-500 to-violet-600',
      features: ['Crowdfunding', 'Inversiones', 'Wallet Digital', 'Pagos QR'],
      link: '/wallet'
    },
    {
      icon: ShoppingBag,
      title: 'E-Commerce OSCORP-e',
      description: 'Marketplace multivendedor para productos y servicios. Tu negocio abierto las 24 horas a nivel nacional con todas las herramientas de venta.',
      color: 'from-emerald-500 to-emerald-600',
      features: ['Tienda Propia', 'Pagos Integrados', 'Gestión de Stock', 'Analytics'],
      link: '/tienda'
    }
  ];

  return (
    <section id="servicios" className="py-24 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-violet-500/20 text-violet-600 dark:text-violet-400">
            Nuestros Servicios
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tres Pilares para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Crecimiento</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Soluciones integrales diseñadas para impulsar tu éxito financiero y empresarial
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800">
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-6',
                  'bg-gradient-to-br',
                  service.color
                )}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{service.description}</p>
                
                <ul className="space-y-2 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link to={service.link}>
                  <Button variant="outline" className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-violet-600 group-hover:text-white group-hover:border-transparent transition-all">
                    Saber Más
                    <ArrowRight className="w-4 h-4 ml-2" />
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
    { name: 'Deportes Pro', category: 'Deportes', products: 345, rating: 4.7, image: '/images/fintech-concept.jpg' },
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
    <section id="marketplace" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Store className="w-3 h-3 mr-1" />
            Marketplace Multivendedor
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tu Tienda, Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600">Negocio</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Crea tu tienda en minutos. Vende productos, servicios y cursos. 
            Gestiona todo desde un solo lugar.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-16">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                <cat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium text-sm">{cat.name}</p>
              <p className="text-xs text-gray-500">{cat.count} productos</p>
            </motion.div>
          ))}
        </div>

        {/* Featured Stores */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Tiendas Destacadas</h3>
            <Link to="/app/tienda">
              <Button variant="ghost" className="text-blue-600">
                Ver Todas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stores.map((store, index) => (
              <motion.div
                key={store.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-slate-700"
              >
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                  <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge className="bg-white/90 text-gray-900">{store.category}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg mb-1">{store.name}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{store.products} productos</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-8 md:p-12 text-center text-white"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Quieres Vender en Oscorp?
          </h3>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Crea tu tienda gratis en minutos. Accede a miles de clientes, 
            gestiona tus ventas y recibe pagos de forma segura.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-blue-600">
                Crear Mi Tienda
                <Store className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/seller/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Panel de Vendedor
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  return (
    <section id="nosotros" className="py-24 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Users className="w-3 h-3 mr-1" />
              Nosotros
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ingenio <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Empresarial</span>
            </h2>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Somos una empresa paraguaya comprometida con la economía colaborativa. 
                Entregamos beneficios y soluciones en Educación Financiera, Empresarial e Inversiones.
              </p>
              
              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-700 dark:text-gray-300 mb-6">
                "Estás aquí no solo para ganarte la vida. Estás aquí para que el mundo pueda 
                vivir más ampliamente con mayor visión, con mejor espíritu de esperanza y logro."
                <footer className="text-sm text-gray-500 mt-2 not-italic">— Woodrow Wilson</footer>
              </blockquote>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                <strong>Ayudamos a las personas para que descubran, desarrollen y aprovechen 
                su ACTITUD para generar RIQUEZA.</strong>
              </p>
            </div>

            {/* 3 C's */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { letter: 'CREER', desc: 'de una forma diferente', color: 'bg-blue-500' },
                { letter: 'CREAR', desc: 'de una forma diferente', color: 'bg-violet-500' },
                { letter: 'CRECER', desc: 'de una forma diferente', color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.letter} className="text-center">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2', item.color)}>
                    <span className="text-white font-bold text-lg">{item.letter[0]}</span>
                  </div>
                  <p className="font-bold text-sm">{item.letter}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-3xl blur-2xl opacity-20" />
            <div className="relative grid grid-cols-2 gap-4">
              <img 
                src="/images/education.jpg" 
                alt="Oscorp Education" 
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <img 
                src="/images/hero-business.jpg" 
                alt="Oscorp Business" 
                className="rounded-2xl shadow-lg w-full h-64 object-cover mt-8"
              />
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
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            <Star className="w-3 h-3 mr-1" />
            Testimonios
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Lo que Dicen Nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Clientes</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-8"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">"{testimonial.content}"</p>
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
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
    <section id="contacto" className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-white/20 text-white">
              Contacto
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Dónde Estamos?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Contáctanos y comienza tu camino hacia el éxito financiero. 
              Estamos aquí para ayudarte.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Teléfonos</p>
                  <p className="font-medium">0972 540 579 / 0975 675 844</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="font-medium">info@oscorp.com.py</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Dirección</p>
                  <p className="font-medium">Calle Sebastián Ortiz (ex Calle 8) casi San Cosme</p>
                  <p className="text-sm text-white/60">Barrio Santa Librada, Coronel Bogado - Itapúa - Paraguay</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6">Envíanos un Mensaje</h3>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Nombre" 
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                />
              </div>
              <input 
                type="text" 
                placeholder="Asunto" 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
              />
              <textarea 
                placeholder="Mensaje" 
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 resize-none"
              />
              <Button className="w-full bg-white text-blue-900 hover:bg-white/90">
                Enviar Mensaje
                <ArrowRight className="w-4 h-4 ml-2" />
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
    <footer className="bg-slate-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <OscorpLogo className="mb-4" size="md" />
            <p className="text-gray-400 text-sm">
              "Te conectamos con tu éxito financiero"
            </p>
            <p className="text-gray-500 text-xs mt-2">
              CREER · CREAR · CRECER
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/app/tienda" className="hover:text-white transition-colors">Tienda</Link></li>
              <li><Link to="/app/cursos" className="hover:text-white transition-colors">Cursos</Link></li>
              <li><Link to="/app/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
              <li><Link to="/app/ingenio" className="hover:text-white transition-colors">Ingenio Millonario</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#marketplace" className="hover:text-white transition-colors">Marketplace</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Oscorp - Ingenio Empresarial. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Mail className="w-5 h-5" />
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
    </div>
  );
}
