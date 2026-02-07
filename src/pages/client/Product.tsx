import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Store, Star, Minus, Plus, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ClientProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart, getItemQuantity } = useCartStore();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const data = await productsApi.getById(id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const store = product.seller ? {
    name: `${product.seller.firstName} ${product.seller.lastName}`,
    logo: null
  } : null;

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success('Producto agregado al carrito');
  };

  const inCart = isInCart(product.id);
  const cartQuantity = getItemQuantity(product.id);

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold line-clamp-1">{product.name}</h1>
      </div>

      {/* Images */}
      <div className="px-4">
        <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
          {product.images && product.images[selectedImage] ? (
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {product.images.map((image: string, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-2">{product.category}</Badge>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <p className="text-3xl font-bold text-foreground">{formatCurrency(product.price)}</p>
          {product.comparePrice && (
            <p className="text-lg text-muted-foreground line-through">{formatCurrency(product.comparePrice)}</p>
          )}
        </div>

        {/* Store */}
        {store && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center">
              <Store className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{store.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-foreground">4.8</span>
              </div>
            </div>
            <Button variant="outline" size="sm">Ver tienda</Button>
          </div>
        )}

        {/* Description */}
        <div className="mt-4">
          <h3 className="font-semibold text-foreground">Descripción</h3>
          <p className="text-muted-foreground mt-2">{product.description}</p>
        </div>

        {/* Stock */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Stock disponible: <span className="font-medium text-foreground">{product.stock} unidades</span>
          </p>
        </div>
      </div>

      {/* Add to Cart Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {/* Quantity */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-md transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <Button
            className="flex-1"
            onClick={handleAddToCart}
            disabled={inCart}
          >
            {inCart ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                En carrito ({cartQuantity})
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Agregar al carrito
              </>
            )}
          </Button>

          {/* Go to cart */}
          {inCart && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/app/carrito')}
              title="Ver carrito"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
