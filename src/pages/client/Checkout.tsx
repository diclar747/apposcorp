import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, CreditCard, Truck, Check, ChevronRight } from 'lucide-react';
import { useAuthStore, useCartStore, useWalletStore } from '@/stores';
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearCart();
    toast.success('¡Compra realizada con éxito!');
    navigate('/app/pedidos');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay productos en el carrito</p>
        <Button onClick={() => navigate('/app/tienda')} className="mt-4">
          Ir a la tienda
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500">Completa tu compra</p>
      </div>

      {/* Products Summary */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Resumen de productos</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{item.quantity}x</span>
                    <span className="text-sm line-clamp-1">{item.product.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Method */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Método de entrega</h3>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <div className="space-y-2">
                {deliveryMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                      <method.icon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium">{method.label}</p>
                      </div>
                      <span className="text-green-600 font-medium">Gratis</span>
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
            <h3 className="font-semibold mb-3">Método de pago</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                      <method.icon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            {paymentMethod === 'wallet' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Saldo disponible</span>
                  <span className="font-bold">{formatCurrency(wallet?.balance || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold">Total a pagar</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
          </div>
          <Button 
            className="w-full bg-blue-600"
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
