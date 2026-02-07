import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { useCartStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ClientCart() {
  const navigate = useNavigate();
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tu carrito está vacío</h2>
        <p className="text-muted-foreground text-center mt-2">Agrega productos para comenzar a comprar</p>
        <Link to="/app/tiendas">
          <Button className="mt-6">Explorar tienda</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Carrito</h1>
          <p className="text-sm text-muted-foreground">{itemCount} productos</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Vaciar
        </button>
      </div>

      {/* Items */}
      <div className="px-4 space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Image */}
                  <Link to={`/app/producto/${item.product.id}`}>
                    <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/producto/${item.product.id}`}>
                      <p className="font-medium text-foreground line-clamp-2">{item.product.name}</p>
                    </Link>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          removeItem(item.product.id);
                          toast.success('Producto eliminado');
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Envío</span>
            <span className="font-medium text-green-600 dark:text-green-400">Gratis</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
            <span className="text-lg font-bold text-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate('/app/checkout')}
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
