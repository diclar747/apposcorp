import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, CreditCard, Truck, Check } from 'lucide-react';
import { useAuthStore, useCartStore, useWalletStore } from '@/stores';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'wallet', label: 'Pagar con Wallet', icon: Wallet, description: 'Usa tu saldo disponible' },
  { id: 'cash', label: 'Pago contra entrega', icon: CreditCard, description: 'Paga cuando recibas' },
];

const deliveryMethods = [
  { id: 'delivery', label: 'Delivery', icon: Truck, price: 0 },
  { id: 'pickup', label: 'Retiro en tienda', icon: MapPin, price: 0 },
];

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const { wallet } = useWalletStore();

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = total + (deliveryMethod === 'delivery' ? 15000 : 0);

  const handleCheckout = async () => {
    if (paymentMethod === 'wallet' && (wallet?.balance || 0) < finalTotal) {
      toast.error('Saldo insuficiente en tu wallet');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        sellerId: items[0]?.product.sellerId,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variant: null
        })),
        deliveryType: deliveryMethod,
        deliveryAddress: {
          street: user?.address || '',
          number: '',
          city: user?.city || '',
        },
        deliveryNotes: '',
        paymentMethod,
      };

      await ordersApi.create(orderData);

      clearCart();
      toast.success('¡Compra realizada con éxito!');
      navigate('/app/pedidos');

      if (paymentMethod === 'wallet') {
        const { fetchWallet } = useWalletStore.getState();
        if (user?.id) fetchWallet(user.id);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Error al procesar la compra');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay productos en el carrito</p>
        <Button onClick={() => navigate('/app/tiendas')} className="mt-4">
          Ir a la tienda
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground">Completa tu compra</p>
      </div>

      {/* Products Summary */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Resumen de productos</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.quantity}x</span>
                    <span className="text-sm text-foreground line-clamp-1">{item.product.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Method */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Método de entrega</h3>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <div className="space-y-2">
                {deliveryMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                      <method.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{method.label}</p>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-medium">Gratis</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Método de pago</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                      <method.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{method.label}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {paymentMethod === 'wallet' && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saldo disponible</span>
                  <span className="font-bold text-foreground">{formatCurrency(wallet?.balance || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-foreground">Total a pagar</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(finalTotal)}</span>
          </div>
          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirmar compra
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
