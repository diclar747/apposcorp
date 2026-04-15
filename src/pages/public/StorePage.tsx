import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, MapPin, Phone, Clock, Star, ShoppingBag,
  MessageCircle, Search, Filter, X, Plus, Minus,
  ChevronRight, ArrowLeft, Share2, ShieldCheck,
  CheckCircle2, Info, StarHalf, MessageSquare,
  Package, LayoutGrid, List, Loader2
} from 'lucide-react';
import { Drawer } from 'vaul';
import { storesApi } from '@/lib/api';
import { formatCurrency, isStoreOpen, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { reviewsApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart Store
  const { addItem, items, total, removeItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const fetchStore = async () => {
      if (!slug) return;
      try {
        const data = await storesApi.getBySlug(slug);
        setStore(data);
        
        // Init price range
        if (data.products && data.products.length > 0) {
          const max = Math.max(...data.products.map((p: any) => p.price));
          setPriceRange([0, max]);
          setTempPriceRange([0, max]);
        }

        // Fetch real reviews
        const reviewsData = await reviewsApi.getByStore(data.id);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('¡Enlace copiado al portapapeles!');
  };

  const handleLeaveReview = async () => {
    try {
      const newReview = await reviewsApi.create({
        storeId: store.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setReviews([newReview, ...reviews]);
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('¡Gracias por tu opinión!');
    } catch (error) {
      toast.error('Debes iniciar sesión para dejar una opinión');
    }
  };

  const categories = useMemo((): string[] => {
    if (!store?.products) return [];
    const cats = new Set<string>(store.products.map((p: any) => p.category));
    return ['todos', ...Array.from(cats)];
  }, [store]);

  const filteredProducts = useMemo(() => {
    if (!store?.products) return [];
    return store.products.filter((p: any) => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
      const isVisible = p.visibility !== 'local';
      
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

      return matchesSearch && matchesCategory && isVisible && matchesPrice;
    });
  }, [store, searchQuery, selectedCategory, priceRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md border border-gray-100 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
            Tienda no encontrada
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Lo sentimos, la tienda que buscas no está disponible en este momento.
          </p>
          <Link to="/app/tiendas">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Ver otras tiendas
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const open = store.businessHours ? isStoreOpen(store.businessHours) : false;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
      {/* Premium Banner Section */}
      <div className="relative h-[25vh] md:h-[35vh] overflow-hidden">
        {store.banner ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            src={store.banner}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full relative">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80"
              alt="Agroferia Banner"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-indigo-600/40 to-violet-600/40 mix-blend-multiply" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Navigation Overlays */}
        {!isInApp && (
          <>
            <div className="absolute top-6 left-6 md:left-12 flex gap-4">
              <Link to="/app/tiendas">
                <Button variant="outline" className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>

            <div className="absolute top-6 right-6 md:right-12 flex gap-3">
              <Button 
                onClick={handleShare}
                size="icon" 
                variant="outline" 
                className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Floating Store Header Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-slate-900 p-1.5 shadow-2xl relative z-10 overflow-hidden shrink-0"
            >
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full rounded-[2.2rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[2.2rem] bg-gray-50 flex items-center justify-center">
                  <Store className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </motion.div>
            <div className="flex-1 pb-2 flex flex-col items-center md:items-start">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg tracking-tight">
                  {store.name}
                </h1>
                {store.isVerified && (
                  <CheckCircle2 className="w-6 h-6 text-blue-400 fill-white" />
                )}
                <Badge className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  open ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50"
                )}>
                  {open ? 'Abierto Ahora' : 'Cerrado'}
                </Badge>
              </div>
              <p className="text-gray-300 text-lg max-w-2xl font-light mb-4 line-clamp-1">
                {store.description}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-gray-200 font-medium">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-base font-bold">{avgRating}</span>
                  <span className="opacity-70">({reviews.length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="line-clamp-1">{store.address}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="whitespace-nowrap">{store.products?.length || 0} productos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <Tabs defaultValue="productos" className="w-full">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
            <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-1 rounded-2xl border border-white/20">
              <TabsTrigger value="productos" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg font-bold">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Catálogo
              </TabsTrigger>
              <TabsTrigger value="info" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg font-bold">
                <Info className="w-4 h-4 mr-2" />
                Información
              </TabsTrigger>
              <TabsTrigger value="opiniones" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg font-bold">
                <MessageSquare className="w-4 h-4 mr-2" />
                Opiniones
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto relative">
              {/* Search Bar */}
              <div className="relative flex-1 lg:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Buscar en la tienda..."
                  className="pl-11 h-12 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                variant="outline" 
                className={cn(
                  "h-12 w-12 rounded-2xl p-0 border-gray-100 dark:border-slate-800 transition-colors",
                  isFilterOpen && "bg-blue-600 text-white border-blue-600"
                )}
              >
                <Filter className="w-5 h-5" />
              </Button>

              <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-gray-100 dark:border-slate-800 flex gap-1 shadow-sm h-12">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-xl w-10 h-10"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-xl w-10 h-10"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-80 p-7 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-slate-800 z-50"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Rango de Precio</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 font-black">
                          {formatCurrency(tempPriceRange[0])} - {formatCurrency(tempPriceRange[1])}
                        </Badge>
                      </div>

                      <div className="px-2 pt-4">
                        <Slider
                          defaultValue={[tempPriceRange[0], tempPriceRange[1]]}
                          max={Math.max(...(store?.products?.map((p: any) => p.price) || [1000000]))}
                          step={5000}
                          value={[tempPriceRange[0], tempPriceRange[1]]}
                          onValueChange={(val: number[]) => setTempPriceRange([val[0], val[1]])}
                          className="mb-8"
                        />
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span>Mínimo</span>
                          <span>Máximo</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                         <Button 
                          variant="ghost" 
                          size="sm"
                          className="rounded-xl font-bold text-gray-400"
                          onClick={() => {
                            const max = Math.max(...(store?.products?.map((p: any) => p.price) || [1000000]));
                            setTempPriceRange([0, max]);
                            setPriceRange([0, max]);
                            setIsFilterOpen(false);
                          }}
                        >
                          Reiniciar
                        </Button>
                        <Button 
                          size="sm"
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 dark:shadow-none"
                          onClick={() => {
                            setPriceRange(tempPriceRange);
                            setIsFilterOpen(false);
                          }}
                        >
                          Aplicar Filtro
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <TabsContent value="productos" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-8">
                <div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Categorías</h3>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm capitalize",
                          selectedCategory === cat
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-900"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none">
                  <ShieldCheck className="w-10 h-10 mb-4 opacity-80" />
                  <h4 className="font-black text-xl mb-2 leading-tight">Compra con Confianza</h4>
                  <p className="text-white/80 text-sm leading-relaxed mb-4 font-medium">
                    Todos tus pagos están protegidos por el sistema de seguridad de Oscorp.
                  </p>
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-indigo-600 border-0 backdrop-blur-md">
                    Saber más
                  </Button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="lg:col-span-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.length > 0 ? (
                    <motion.div
                      layout
                      className={cn(
                        "grid gap-8",
                        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                      )}
                    >
                      {filteredProducts.map((product: any) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={() => addItem(product, 1)}
                          onViewProduct={() => {
                            setSelectedProduct(product);
                            setActiveImageIndex(0);
                          }}
                          viewMode={viewMode}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800"
                    >
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sin resultados</h3>
                      <p className="text-gray-500">Prueba con otra búsqueda o categoría.</p>
                      <Button
                        variant="link"
                        onClick={() => { 
                          setSearchQuery(''); 
                          setSelectedCategory('todos');
                          const max = Math.max(...(store?.products?.map((p: any) => p.price) || [1000000]));
                          setPriceRange([0, max]);
                          setTempPriceRange([0, max]);
                        }}
                        className="text-blue-600 font-bold mt-2"
                      >
                        Limpiar filtros
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <Store className="w-6 h-6 text-blue-600" />
                    Sobre nosotros
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-light">
                    {store.description}
                  </p>
                </section>

                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-red-500" />
                    Ubicación y Contacto
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Dirección Física</p>
                        <p className="font-bold text-gray-900 dark:text-white">{store.address}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">WhatsApp / Celular</p>
                        <p className="font-bold text-gray-900 dark:text-white">{store.phone}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Correo Electrónico</p>
                        <p className="font-bold text-gray-900 dark:text-white">{store.email}</p>
                      </div>
                    </div>
                    <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent transition-colors" />
                      <MapPin className="w-12 h-12 text-gray-300 group-hover:text-blue-500 transition-all duration-500 transform group-hover:scale-110" />
                      <span className="absolute bottom-4 text-xs font-black text-gray-400">MAPA INTERACTIVO</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-violet-600" />
                    Horarios
                  </h3>
                  <div className="space-y-3 font-medium">
                    {(() => {
                      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                      const dayLabels: Record<string, string> = {
                        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                      };
                      
                      // Use stored hours or a sensible default if missing
                      const hoursData = store.businessHours || {
                        monday: { isOpen: true, open: '08:00', close: '18:00' },
                        tuesday: { isOpen: true, open: '08:00', close: '18:00' },
                        wednesday: { isOpen: true, open: '08:00', close: '18:00' },
                        thursday: { isOpen: true, open: '08:00', close: '18:00' },
                        friday: { isOpen: true, open: '08:00', close: '18:00' },
                        saturday: { isOpen: true, open: '08:00', close: '13:00' },
                        sunday: { isOpen: false, open: '00:00', close: '00:00' },
                      };

                      const todayIndex = new Date().getDay(); // 0 is Sunday
                      const todayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][todayIndex];

                      return days.map((day) => {
                        const hours = hoursData[day];
                        const isToday = day === todayName;

                        return (
                          <div 
                            key={day} 
                            className={cn(
                              "flex justify-between items-center py-2 px-3 rounded-xl transition-all",
                              isToday ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800" : "border-b border-gray-50 dark:border-slate-800 last:border-0"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm", isToday ? "text-blue-700 dark:text-blue-400 font-black" : "text-gray-500 font-bold")}>
                                {dayLabels[day]}
                              </span>
                              {isToday && <Badge className="bg-blue-600 text-[8px] h-4 px-1.5 uppercase tracking-tighter">Hoy</Badge>}
                            </div>
                            {hours?.isOpen ? (
                              <span className={cn("text-sm font-black", isToday ? "text-blue-900 dark:text-white" : "text-gray-900 dark:text-gray-300")}>
                                {hours.open} - {hours.close}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-red-500 italic opacity-70">Cerrado</span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>

                <Button 
                  onClick={() => {
                    const number = store.whatsappNumber || store.phone;
                    const cleanNumber = number.replace(/\D/g, '');
                    const message = `Hola ${store.name}, vengo de tu tienda en Oscorp y me gustaría realizar una consulta.`;
                    window.open(`https://wa.me/${cleanNumber.startsWith('595') ? cleanNumber : '595' + cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-3xl text-lg font-black shadow-xl shadow-green-100 dark:shadow-none transition-all hover:scale-[1.02]"
                >
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Escribir por WhatsApp
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="opiniones">
            <div className="grid md:grid-cols-3 gap-10">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Promedio General</p>
                  <div className="text-7xl font-black text-gray-900 dark:text-white mb-2 leading-none">{avgRating}</div>
                  <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
                    <StarHalf className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Basado en {reviews.length} experiencias reales de clientes.</p>
                </div>

                <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 dark:shadow-none">
                  <h4 className="font-black text-2xl mb-4 leading-tight">¿Qué te pareció esta tienda?</h4>
                  <p className="text-blue-100 text-sm mb-6 leading-relaxed">Tu opinión ayuda a otros compradores y hace crecer a nuestros vendedores.</p>
                  <Button 
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 h-14 rounded-2xl font-black border-0"
                  >
                    Dejar mi opinión
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-700">
                          {review.user?.avatar ? (
                            <img src={review.user.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-black text-gray-400">{review.user?.firstName?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 dark:text-white text-lg">{review.user?.firstName} {review.user?.lastName}</h4>
                          <div className="flex gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-xs font-bold text-gray-400 tracking-wider">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed">
                        "{review.comment}"
                      </p>
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <MessageSquare className="w-24 h-24 text-gray-900" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
                    <p className="text-gray-400 font-bold">Aún no hay reseñas para esta tienda.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modern Cart Drawer with Vaul - Moved higher when in-app to avoid BottomNav overlap */}
      <CartDrawer
        items={items}
        total={total}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        bottomOffset={isInApp ? "bottom-24" : "bottom-10"}
      />

      {/* Opinion Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none dark:bg-slate-900">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-3xl font-black tracking-tight">Tu Experiencia</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium pt-2">
              Califica tu experiencia con <span className="text-blue-600 font-bold">{store.name}</span>. Tu opinión es muy valiosa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-8 space-y-8 pb-8">
            <div className="flex flex-col items-center gap-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-3xl">
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Selecciona tu calificación</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "w-10 h-10 transition-colors",
                        star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-slate-700"
                      )}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">¿Qué te pareció?</label>
              <Textarea 
                placeholder="Escribe aquí tu comentario, sugerencia o agradecimiento..."
                className="min-h-[120px] rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 text-base"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest"
              onClick={() => setIsReviewModalOpen(false)}
            >Cancelar</Button>
            <Button 
              className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-none"
              onClick={handleLeaveReview}
            >Enviar Opinión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[800px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none bg-white dark:bg-slate-900 shadow-3xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row gap-0">
              {/* Product Image Gallery */}
              <div className="md:w-1/2 bg-gray-50 dark:bg-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
                <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl">
                  <img 
                    src={selectedProduct.images[activeImageIndex] || selectedProduct.images[0]} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                </div>
                {selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full">
                    {selectedProduct.images.map((img: string, i: number) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveImageIndex(i)}
                        className={cn(
                          "w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer",
                          activeImageIndex === i ? "border-blue-500 scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="md:w-1/2 p-8 md:p-10 flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] text-blue-600 border-blue-100 dark:border-blue-900/30 px-3 py-1">
                      {selectedProduct.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 px-3 py-1 rounded-full text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-yellow-600" />
                      <span>4.9 (24 reseñas)</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4">{selectedProduct.name}</h2>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                      {formatCurrency(selectedProduct.price)}
                    </span>
                    {selectedProduct.comparePrice && (
                      <span className="text-lg text-gray-400 line-through font-bold mb-1.5 opacity-60">
                        {formatCurrency(selectedProduct.comparePrice)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Descripción</h4>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      {selectedProduct.description || 'Este producto no cuenta con una descripción detallada.'}
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-4 pt-6 border-t dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>Disponibilidad: <span className="text-green-500">En Stock</span></span>
                    <span>SKU: {selectedProduct.sku || 'N/A'}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        addItem(selectedProduct, 1);
                        setSelectedProduct(null);
                        toast.success('Producto añadido al carrito');
                      }}
                      className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95"
                    >
                      Añadir al Carrito
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-components ---

function ProductCard({ product, onAddToCart, onViewProduct, viewMode }: { product: any, onAddToCart: () => void, onViewProduct: () => void, viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-8 hover:shadow-2xl transition-all duration-500"
      >
        <div className="w-full md:w-60 h-60 rounded-3xl overflow-hidden relative bg-gray-50 dark:bg-slate-800">
          <img src={product.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {product.comparePrice && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
              -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-2">
          <div>
            <div className="flex justify-between items-start mb-2 font-black">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-blue-600 border-blue-100">{product.category}</Badge>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">4.9</span>
              </div>
            </div>
            <h3 
              onClick={onViewProduct}
              className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 cursor-pointer transition-colors leading-tight"
            >
              {product.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-light leading-relaxed">{product.description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-0.5">
              <p className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">
                {formatCurrency(product.price)}
              </p>
              {product.comparePrice && (
                <p className="text-gray-400 line-through text-sm font-bold opacity-70">
                  {formatCurrency(product.comparePrice)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={onViewProduct} size="icon" variant="outline" className="h-14 w-14 rounded-2xl border-gray-100 active:scale-95 shadow-sm">
                <Search className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="outline" className="h-14 w-14 rounded-2xl border-gray-100 active:scale-95 shadow-sm">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                onClick={onAddToCart}
                className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-lg shadow-blue-100 dark:shadow-none min-w-[200px]"
              >
                <Plus className="w-5 h-5 mr-3 stroke-[3]" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 h-full flex flex-col transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] group"
    >
      <div className="aspect-[4/5] overflow-hidden relative rounded-[2.3rem] m-2.5 bg-gray-50 dark:bg-slate-800">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 cursor-pointer"
          onClick={onViewProduct}
        />

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <Button 
            onClick={onViewProduct}
            size="icon" 
            className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl text-gray-900 hover:bg-white shadow-xl mb-2"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {product.comparePrice && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
            SALE
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <Button
            onClick={onAddToCart}
            className="w-full h-14 bg-white/95 backdrop-blur-xl text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl font-black shadow-2xl border-0"
          >
            Añadir al carrito
          </Button>
        </div>
      </div>

      <div className="p-7 pt-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <span>{product.category}</span>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-3 h-3 fill-yellow-500" />
            <span>4.9</span>
          </div>
        </div>
        <h4 
          onClick={onViewProduct}
          className="font-black text-gray-900 dark:text-white text-xl mb-3 leading-tight group-hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
        >
          {product.name}
        </h4>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through font-bold mb-0.5">{formatCurrency(product.comparePrice)}</span>
            )}
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
              {formatCurrency(product.price)}
            </span>
          </div>
          <button
            onClick={onAddToCart}
            className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl transition-all hover:bg-blue-600 hover:text-white hover:rotate-90"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CartDrawer({ items, total, removeItem, updateQuantity, bottomOffset = "bottom-10" }: { items: any[], total: number, removeItem: (id: string) => void, updateQuantity: (id: string, q: number) => void, bottomOffset?: string }) {
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "fixed right-6 md:right-10 w-16 h-16 md:w-20 md:h-20 bg-blue-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] z-50 group active:scale-95 transition-all",
            bottomOffset
          )}
        >
          <div className="relative">
            <ShoppingBag className="w-8 h-8 group-hover:animate-bounce" />
            {itemCount > 0 && (
              <span className="absolute -top-3 -right-3 w-7 h-7 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                {itemCount}
              </span>
            )}
          </div>
        </motion.button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="fixed top-0 bottom-0 right-0 w-full max-w-[500px] h-full bg-white dark:bg-slate-900 z-[101] shadow-2xl flex flex-col outline-none">
          <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
            <div>
              <Drawer.Title className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Tu Carrito</Drawer.Title>
              <p className="text-gray-500 font-medium">{itemCount} productos seleccionados</p>
            </div>
            <Drawer.Close asChild>
              <Button size="icon" variant="ghost" className="rounded-2xl w-12 h-12">
                <X className="w-6 h-6" />
              </Button>
            </Drawer.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.product.id} className="flex gap-6 group">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                    <img src={item.product.images[0]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-900 dark:text-white truncate pr-4">{item.product.name}</h4>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-blue-600 font-bold mb-4">{formatCurrency(item.product.price)}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-2xl p-1 gap-1">
                        <Button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          size="icon" variant="ghost" className="h-8 w-8 rounded-xl"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                        <Button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          size="icon" variant="ghost" className="h-8 w-8 rounded-xl"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">SUBTOTAL: {formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 underline decoration-blue-500 decoration-4">El carrito está vacío</h3>
                <p className="text-gray-500 max-w-xs font-medium">Empieza a añadir los mejores productos de la tienda ahora mismo.</p>
              </div>
            )}
          </div>

          <div className="p-8 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="flex justify-between items-end mb-8">
              <span className="text-gray-500 font-bold text-xl uppercase tracking-tighter">Total a Pagar</span>
              <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="h-16 rounded-3xl border border-gray-200 dark:border-slate-800 font-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                Cotizar Envío
              </button>
              <Link to="/app/checkout" className="block w-full">
                <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl shadow-2xl shadow-blue-100 dark:shadow-none group">
                  Pagar Ahora
                  <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-6 tracking-widest uppercase">
              Procesado de forma segura por Oscorp Pay
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
