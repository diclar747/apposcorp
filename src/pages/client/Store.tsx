import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, ShoppingCart, Loader2, Check } from 'lucide-react';
import { productsApi, storesApi } from '@/lib/api';
import { useCartStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const categories = ['Todos', 'Tecnología', 'Moda', 'Hogar', 'Deportes', 'Servicios', 'Gourmet'];

export default function ClientStore() {
  const [searchParams] = useSearchParams();
  const storeSlug = searchParams.get('store');

  const { addItem, isInCart } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [products, setProducts] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);

  const canPurchaseItem = (p: any) => {
    // Si estamos en una vista de tienda específica, usamos el estado de esa tienda
    if (storeSlug && store) {
      const planName = store.sellerProfile?.plan?.name?.toLowerCase() || '';
      if (planName.includes('básico') || planName.includes('basic')) return false;
      const features = store.sellerProfile?.plan?.features || [];
      return features.some((f: string) => f.toLowerCase().includes('tienda online'));
    }
    // Si es vista general, revisamos el plan del vendedor del producto
    const planName = p.seller?.plan?.name?.toLowerCase() || '';
    if (planName.includes('básico') || planName.includes('basic')) return false;
    const features = p.seller?.plan?.features || [];
    if (features.length === 0) return false; // Por defecto restrictivo si no hay info de plan
    return features.some((f: string) => f.toLowerCase().includes('tienda online'));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (storeSlug) {
          const storeData = await storesApi.getBySlug(storeSlug);
          setStore(storeData);
          setStoreName(storeData.name);
          setProducts(storeData.products || []);
        } else {
          const data = await productsApi.getAll();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeSlug]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }
    return result;
  }, [products, searchTerm, selectedCategory]);

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart(product.id)) return;
    addItem(product, 1);
    toast.success(`${product.name} agregado al carrito`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-foreground">
          {storeName || 'Catálogo de Productos'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {storeName ? `Productos de ${storeName}` : 'Explora todos los productos de nuestras tiendas'}
        </p>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={storeName ? `Buscar en ${storeName}...` : "Buscar productos..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              size="sm"
              className="whitespace-nowrap rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product, index) => {
            const isOutOfStock = product.stock <= 0;
            return (
              <Link key={product.id} to={`/app/producto/${product.id}`} className={cn(isOutOfStock && "pointer-events-none")}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group h-full flex flex-col",
                    isOutOfStock && "opacity-60 grayscale"
                  )}
                >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.comparePrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      OFERTA
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-2 z-10">
                      <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20">
                        SIN STOCK
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 sm:p-4 flex-1 flex flex-col">
                  <p className="text-xs text-primary font-medium mb-1">{product.category}</p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 flex-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-lg">{formatCurrency(product.price)}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.comparePrice)}</span>
                      )}
                    </div>
                    {canPurchaseItem(product) ? (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`h-10 w-10 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-colors ${
                          isInCart(product.id)
                            ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {isInCart(product.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </motion.button>
                    ) : isOutOfStock ? (
                      <span className="text-[10px] font-bold text-red-500 uppercase">Sin Stock</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-[10px] border-green-200 text-green-600 font-bold"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const number = product.seller?.whatsappNumber || product.seller?.phone || '';
                          const cleanNumber = number.replace(/\D/g, '');
                          const sellerName = product.seller?.storeName || 'Vendedor';
                          const message = `Hola ${sellerName}, me interesa el producto "${product.name}". ¿Sigue disponible?`;
                          window.open(`https://wa.me/${cleanNumber.startsWith('595') ? cleanNumber : '595' + cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        Consultar
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
