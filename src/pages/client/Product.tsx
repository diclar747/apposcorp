import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Store, Star, Minus, Plus, Check, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/stores';
import { productsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
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
  const [isFavorite, setIsFavorite] = useState(false);

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

  const store = useMemo(() => {
    if (!product?.seller) return null;
    const seller = product.seller;
    return {
      name: seller.storeName || `${seller.user?.firstName || ''} ${seller.user?.lastName || ''}`.trim() || 'Tienda',
      slug: seller.storeSlug,
      logo: seller.logo,
      phone: seller.whatsappNumber || seller.phone || seller.user?.phone,
      plan: seller.plan
    };
  }, [product]);

  const canPurchase = useMemo(() => {
    if (!store?.plan) return false;
    const planName = store.plan.name.toLowerCase();
    if (planName.includes('básico') || planName.includes('basic')) return false;
    
    const features = store.plan.features || [];
    return features.some((f: string) => f.toLowerCase().includes('tienda online'));
  }, [store]);

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
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn("p-2 rounded-lg transition-colors", isFavorite ? "bg-rose-50 text-rose-500" : "hover:bg-muted")}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: product.description,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('¡Enlace copiado al portapapeles!');
                }
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
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
              {store.logo ? (
                <img src={store.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{store.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-foreground">4.8</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/app/tienda/${store.slug}`)}
            >
              Ver tienda
            </Button>
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
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {canPurchase && (
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
            )}

            {/* Add Button */}
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!canPurchase || inCart}
            >
              {!canPurchase ? (
                'Visitar tienda para comprar'
              ) : inCart ? (
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
            {canPurchase && inCart && (
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

          {!canPurchase && (
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              onClick={() => {
                const number = store?.phone || '';
                const cleanNumber = number.replace(/\D/g, '');
                const message = `Hola ${store?.name}, me interesa el producto "${product.name}". ¿Sigue disponible?`;
                window.open(`https://wa.me/${cleanNumber.startsWith('595') ? cleanNumber : '595' + cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
              }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Consultar por WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
