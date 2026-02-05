import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Store, Star, ArrowLeft, Heart,
  Share2, ShieldCheck, Truck, RotateCcw,
  MessageCircle, Plus, Minus, Check, ChevronRight,
  Info, Sparkles, StarHalf, MessageSquare,
  Package, LayoutGrid, List, Search
} from 'lucide-react';
import { getProductBySlug, getReviewsByProductId, mockStores } from '@/data/mockData';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  const { addItem, items, updateQuantity } = useCartStore();

  const product = useMemo(() => slug ? getProductBySlug(slug) : null, [slug]);
  const reviews = useMemo(() => product ? getReviewsByProductId(product.id) : [], [product]);
  const store = useMemo(() => product ? mockStores.find(s => s.id === product.storeId) : null, [product]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const inCart = useMemo(() => items.find(item => item.product.id === product?.id), [items, product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl max-w-md border border-gray-100 dark:border-slate-800"
        >
          <ShoppingBag className="w-20 h-20 text-gray-200 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Producto no disponible</h1>
          <p className="text-gray-500 mb-8">El producto que buscas ya no forma parte de nuestro catálogo premium.</p>
          <Button onClick={() => navigate('/app/tiendas')} className="w-full bg-blue-600 h-14 rounded-2xl font-black">
            Explorar otras tiendas
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} añadido al carrito`, {
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      position: 'bottom-center'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32">
      {/* Dynamic Header Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/30 text-gray-900 dark:text-white rounded-2xl hover:bg-white transition-all shadow-xl"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "w-12 h-12 flex items-center justify-center backdrop-blur-xl border border-white/30 rounded-2xl transition-all shadow-xl",
              isLiked ? "bg-rose-500 text-white border-rose-600" : "bg-white/20 text-gray-900 dark:text-white hover:bg-white"
            )}
          >
            <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-xl border border-white/30 text-gray-900 dark:text-white rounded-2xl hover:bg-white transition-all shadow-xl">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left Side: Immersive Gallery */}
          <div className="space-y-6">
            <motion.div
              layoutId={`product-image-${product.id}`}
              className="aspect-square bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-2xl relative group"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {product.comparePrice && (
                <div className="absolute top-8 left-8 bg-blue-600 text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                  Oferta Premium
                </div>
              )}
            </motion.div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all p-1 bg-white dark:bg-slate-900",
                    selectedImage === idx ? "border-blue-600 shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Glassmorphism Info Panel */}
          <div className="space-y-10">
            <header>
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="bg-blue-600/5 text-blue-600 border-blue-100 px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">
                  {product.category}
                </Badge>
                {product.isFeatured && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Destacado
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn("w-4 h-4 fill-amber-400 text-amber-400", i > Number(avgRating) && "opacity-20")} />
                    ))}
                  </div>
                  <span className="font-black text-gray-900 dark:text-white">{avgRating}</span>
                  <span className="text-gray-400 font-medium">({reviews.length} opiniones)</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-2 text-emerald-500 font-black">
                  <Package className="w-4 h-4" />
                  <span>En Stock ({product.stock})</span>
                </div>
              </div>
            </header>

            <div className="p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <ShoppingBag className="w-40 h-40" />
              </div>

              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {formatCurrency(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-xl text-gray-400 line-through font-bold opacity-60">
                    {formatCurrency(product.comparePrice)}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-gray-100 dark:border-slate-800">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-14 text-center text-xl font-black">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                    Selecciona la cantidad <br /> que deseas adquirir
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {inCart ? (
                      <>
                        <Check className="w-6 h-6 mr-3 stroke-[3]" />
                        En el Carrito
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-6 h-6 mr-3 stroke-[2]" />
                        Comprar Ahora
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, label: 'Garantía Oscorp', color: 'text-blue-500' },
                { icon: Truck, label: 'Envío Flash', color: 'text-violet-500' },
                { icon: RotateCcw, label: 'Devolución 30d', color: 'text-amber-500' }
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-50 dark:border-slate-800 text-center flex flex-col items-center gap-2">
                  <item.icon className={cn("w-6 h-6", item.color)} />
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Store Preview */}
            {store && (
              <div className="p-6 bg-gray-900 rounded-[2.5rem] text-white flex items-center gap-6 group hover:bg-black transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-white/10 p-1">
                  {store.logo ? (
                    <img src={store.logo} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-0.5">Vendido por</p>
                  <h4 className="text-xl font-bold tracking-tight">{store.name}</h4>
                </div>
                <Link to={`/tienda/${store.slug}`}>
                  <button className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white hover:text-gray-900 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Details & Reviews Tabs */}
        <div className="mt-32">
          <Tabs defaultValue="descripcion" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl inline-flex">
                <TabsTrigger value="descripcion" className="rounded-full px-10 py-3 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 font-black text-sm uppercase tracking-widest">
                  Descripción
                </TabsTrigger>
                <TabsTrigger value="especificaciones" className="rounded-full px-10 py-3 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 font-black text-sm uppercase tracking-widest">
                  Especificaciones
                </TabsTrigger>
                <TabsTrigger value="opiniones" className="rounded-full px-10 py-3 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 font-black text-sm uppercase tracking-widest">
                  Opiniones ({reviews.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="descripcion" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-12 lg:p-20 rounded-[4rem] border border-gray-100 dark:border-slate-800 shadow-sm"
              >
                <div className="max-w-3xl mx-auto space-y-10">
                  <h3 className="text-4xl font-black tracking-tight text-center mb-16 underline decoration-blue-600 decoration-8 underline-offset-8">
                    Diseño & Rendimiento
                  </h3>
                  <p className="text-2xl text-gray-600 dark:text-gray-400 font-light leading-relaxed text-center">
                    {product.description}
                  </p>
                  <div className="grid md:grid-cols-2 gap-10 mt-20">
                    <div className="p-8 bg-gray-50 dark:bg-slate-800 rounded-3xl space-y-4">
                      <h4 className="text-xl font-black">Potencia sin límites</h4>
                      <p className="text-gray-500 font-medium">Equipado con las últimas innovaciones tecnológicas de Oscorp para ofrecerte una experiencia fluida.</p>
                    </div>
                    <div className="p-8 bg-gray-50 dark:bg-slate-800 rounded-3xl space-y-4">
                      <h4 className="text-xl font-black">Sostenibilidad Premium</h4>
                      <p className="text-gray-500 font-medium">Materiales de alta durabilidad y procesos de fabricación responsables con el medio ambiente.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="especificaciones">
              <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {[
                      { k: 'Modelo', v: product.sku },
                      { k: 'Categoría', v: product.category },
                      { k: 'Subcategoría', v: product.subcategory || 'General' },
                      { k: 'Garantía', v: '1 Año Oficial' },
                      { k: 'Procedencia', v: 'Importado con Certificación' }
                    ].map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-slate-800 last:border-0">
                        <td className="px-8 py-6 font-black text-gray-400 uppercase text-xs tracking-widest bg-gray-50/50 dark:bg-slate-800/30 w-1/3">{item.k}</td>
                        <td className="px-8 py-6 font-bold text-gray-900 dark:text-white">{item.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="opiniones">
              <div className="grid md:grid-cols-3 gap-10">
                <div className="md:col-span-1">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Calificación del Producto</p>
                    <div className="text-8xl font-black text-gray-900 dark:text-white mb-4">{avgRating}</div>
                    <div className="flex justify-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={cn("w-6 h-6 fill-amber-400 text-amber-400", i > Number(avgRating) && "opacity-20")} />
                      ))}
                    </div>
                    <p className="text-gray-500 font-medium italic">"{reviews.length > 0 ? 'Los clientes aman este producto' : 'Sé el primero en calificarlo'}"</p>
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
                        <div className="flex gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            <span className="text-lg font-black text-gray-400">{review.user?.firstName?.[0]}</span>
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 dark:text-white">{review.user?.firstName} {review.user?.lastName}</h4>
                            <div className="flex gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-3 h-3",
                                    i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-light leading-relaxed">
                          "{review.comment}"
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
                      <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">Aún no hay reseñas para este producto.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
