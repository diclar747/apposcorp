import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Clock, Star, ShoppingBag, MessageCircle } from 'lucide-react';
import { mockStores } from '@/data/mockData';
import { formatCurrency, isStoreOpen } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const store = mockStores.find(s => s.slug === slug);

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Tienda no encontrada</h1>
          <p className="text-gray-500">La tienda que buscas no existe</p>
        </div>
      </div>
    );
  }

  const open = isStoreOpen(store.businessHours);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gray-200 relative">
        {store.banner ? (
          <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
        )}
      </div>

      {/* Store Info */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 relative mb-8">
          {/* Logo */}
          <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-lg">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center">
                <Store className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-16 md:pt-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{store.name}</h1>
              <Badge className={open ? 'bg-green-100 text-green-700 w-fit' : 'bg-red-100 text-red-700 w-fit'}>
                {open ? 'Abierto' : 'Cerrado'}
              </Badge>
            </div>
            <p className="text-gray-600 mt-2 max-w-2xl">{store.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.8</span>
                <span className="text-gray-500">(89 reseñas)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{store.address}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{store.phone}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button className="bg-green-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar
              </Button>
              <Button variant="outline">Ver horarios</Button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {store.products.filter(p => p.visibility !== 'local').map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gray-100">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 line-clamp-2">{product.name}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
