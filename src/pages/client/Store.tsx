import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ShoppingBag, Star, MapPin } from 'lucide-react';
import { mockProducts, mockStores } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const categories = ['Todos', 'Tecnología', 'Moda', 'Hogar', 'Deportes', 'Servicios'];

export default function ClientStore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'products' | 'stores'>('products');

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.visibility !== 'local';
  });

  const filteredStores = mockStores.filter(store => {
    return store.name.toLowerCase().includes(searchTerm.toLowerCase()) && store.isOnline;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Tienda</h1>
        <p className="text-sm text-gray-500">Descubre productos increíbles</p>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar productos o tiendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'products' ? 'default' : 'outline'}
            onClick={() => setViewMode('products')}
            size="sm"
            className="flex-1"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Productos
          </Button>
          <Button
            variant={viewMode === 'stores' ? 'default' : 'outline'}
            onClick={() => setViewMode('stores')}
            size="sm"
            className="flex-1"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Tiendas
          </Button>
        </div>
      </div>

      {/* Categories - Only show in products view */}
      {viewMode === 'products' && (
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        {viewMode === 'products' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => (
              <Link key={product.id} to={`/app/producto/${product.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="h-36 bg-gray-100">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.comparePrice)}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStores.map((store, index) => (
              <Link key={store.id} to={`/tienda/${store.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="h-24 bg-gray-100 relative">
                    {store.banner ? (
                      <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    )}
                  </div>
                  <div className="p-3 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-md p-1 -mt-8">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{store.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.8</span>
                        <span className="text-sm text-gray-400">({store.products.length} productos)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
