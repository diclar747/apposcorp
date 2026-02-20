import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cart Store
  const { addItem, items, total, removeItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const fetchStore = async () => {
      if (!slug) return;
      try {
        const data = await storesApi.getBySlug(slug);
        setStore(data);
      } catch (error) {
        console.error('Error fetching store:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  const reviews: any[] = [];

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
      return matchesSearch && matchesCategory && isVisible;
    });
  }, [store, searchQuery, selectedCategory]);

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
        <div className="absolute top-6 left-6 md:left-12 flex gap-4">
          <Link to="/app/tiendas">
            <Button variant="outline" className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <div className="absolute top-6 right-6 md:right-12 flex gap-3">
          <Button size="icon" variant="outline" className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Floating Store Header Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-6">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white dark:bg-slate-900 p-1.5 shadow-2xl relative z-10 overflow-hidden"
            >
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full rounded-[2.2rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[2.2rem] bg-gray-50 flex items-center justify-center">
                  <Store className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </motion.div>
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg tracking-tight">
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
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-200 font-medium">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-base font-bold">{avgRating}</span>
                  <span className="opacity-70">({reviews.length} reseñas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>{store.products?.length || 0} productos</span>
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

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
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

              <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-gray-100 dark:border-slate-800">
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
                        onClick={() => { setSearchQuery(''); setSelectedCategory('todos'); }}
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
                    {store.businessHours ? Object.entries(store.businessHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-800 last:border-0">
                        <span className="capitalize text-gray-500 text-sm">{day}</span>
                        {hours?.isOpen ? (
                          <span className="text-sm font-black text-gray-900 dark:text-white">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-sm font-bold text-red-400 italic">Cerrado</span>
                        )}
                      </div>
                    )) : (
                      <p className="text-gray-400 text-sm">Horarios no disponibles</p>
                    )}
                  </div>
                </section>

                <Button className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-3xl text-lg font-black shadow-xl shadow-green-100 dark:shadow-none transition-all hover:scale-[1.02]">
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
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 h-14 rounded-2xl font-black border-0">
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

      {/* Modern Cart Drawer with Vaul */}
      <CartDrawer items={items} total={total} removeItem={removeItem} updateQuantity={updateQuantity} />
    </div>
  );
}

// --- Sub-components ---

function ProductCard({ product, onAddToCart, viewMode }: { product: any, onAddToCart: () => void, viewMode: 'grid' | 'list' }) {
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
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors leading-tight">{product.name}</h3>
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
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Floating Actions */}
        <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <Button size="icon" className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl text-gray-900 hover:bg-white shadow-xl mb-2">
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
        <h4 className="font-black text-gray-900 dark:text-white text-xl mb-3 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h4>

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

function CartDrawer({ items, total, removeItem, updateQuantity }: { items: any[], total: number, removeItem: (id: string) => void, updateQuantity: (id: string, q: number) => void }) {
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-10 right-10 w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] z-50 group active:scale-95 transition-all"
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
