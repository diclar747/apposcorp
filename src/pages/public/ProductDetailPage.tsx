import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Store, Star, ArrowLeft } from 'lucide-react';
import { mockProducts, mockStores } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Find product by slug (in a real app, products would have slugs)
  const product = mockProducts.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === slug);
  const store = product ? mockStores.find(s => s.id === product.storeId) : null;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
          <Link to="/">
            <Button className="mt-4">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <Badge className="mb-3">{product.category}</Badge>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="flex items-center gap-2 mt-3">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8</span>
              <span className="text-gray-500">(24 reseñas)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <p className="text-4xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
              {product.comparePrice && (
                <p className="text-xl text-gray-400 line-through">{formatCurrency(product.comparePrice)}</p>
              )}
            </div>

            <p className="text-gray-600 mt-6">{product.description}</p>

            {/* Store */}
            {store && (
              <div className="flex items-center gap-4 mt-6 p-4 bg-gray-100 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-white overflow-hidden">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-500">Vendedor verificado</p>
                </div>
                <Link to={`/tienda/${store.slug}`}>
                  <Button variant="outline" size="sm">Ver tienda</Button>
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <Link to="/login" className="flex-1">
                <Button className="w-full bg-blue-600" size="lg">
                  Iniciar sesión para comprar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
