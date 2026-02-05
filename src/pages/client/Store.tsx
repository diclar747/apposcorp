import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ShoppingBag, Star, MapPin, Loader2, Store as StoreIcon, Clock, Phone, ExternalLink } from 'lucide-react';
import { mockProducts, mockStores } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const categories = ['Todos', 'Tecnología', 'Moda', 'Hogar', 'Deportes', 'Servicios', 'Gourmet', 'Vinos'];

export default function ClientStore() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('id');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Get Store Data if ID exists
  const currentStore = useMemo(() => {
    if (!storeId) return null;
    return mockStores.find(s => s.id === storeId);
  }, [storeId]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    let result = mockProducts;

    // Filter by Store
    if (storeId) {
      result = result.filter(p => p.storeId === storeId);
    }

    // Filter by Search
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }

    return result;
  }, [storeId, searchTerm, selectedCategory]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">

      {/* Store Header (Only if storeId present) */}
      {currentStore ? (
        <div className="bg-white border-b border-gray-200">
          {/* Banner */}
          <div className="h-48 md:h-64 bg-gray-100 relative overflow-hidden">
            {currentStore.banner ? (
              <img src={currentStore.banner} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="max-w-5xl mx-auto px-4 -mt-16 relative pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Logo */}
              <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-lg flex-shrink-0">
                {currentStore.logo ? (
                  <img src={currentStore.logo} alt={currentStore.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center">
                    <StoreIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 mb-2">
                <div>
                  <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100">{currentStore.category || 'Tienda Oficial'}</Badge>
                  <h1 className="text-3xl font-bold text-gray-900">{currentStore.name}</h1>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{currentStore.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="font-medium text-gray-900">{5.0}</span>
                    <span className="text-gray-400">(45 reseñas)</span>
                  </div>
                  {currentStore.businessHours && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Abierto ahora</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="w-4 h-4" />
                  Contactar
                </Button>
              </div>
            </div>

            <div className="mt-6 text-gray-600 max-w-2xl">
              <p>{currentStore.description}</p>
            </div>

            <Separator className="mt-6" />
          </div>
        </div>
      ) : (
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-500">Explora todos los productos de nuestras tiendas</p>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 max-w-5xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={currentStore ? `Buscar en ${currentStore.name}...` : "Buscar productos..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
      <div className="px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <Link key={product.id} to={`/app/producto/${product.id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group h-full flex flex-col"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {product.comparePrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      OFERTA
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-xs text-blue-600 font-medium mb-1">{product.category}</p>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 flex-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-lg">{formatCurrency(product.price)}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
                      )}
                    </div>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <ShoppingBag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
