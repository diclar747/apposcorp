import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Wallet, CreditCard, Truck, Check } from 'lucide-react';
import { useAuthStore, useCartStore, useWalletStore } from '@/stores';
import { ordersApi } from '@/lib/api';
import { getVisitorId } from '@/lib/affiliate';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'wallet', label: 'Pagar con Wallet', icon: Wallet, description: 'Usa tu saldo disponible' },
  { id: 'cash', label: 'Pago contra entrega', icon: CreditCard, description: 'Paga cuando recibas' },
];

const deliveryMethods = [
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'pickup', label: 'Retiro en tienda', icon: MapPin },
];

export default function ClientCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();
  const hasDemoProducts = items.some((item) => item.product.tags?.includes('oscorp-demo'));
  const { wallet } = useWalletStore();
  const needsAddress = items.some((item) => item.product.type === 'physical');

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const canDeliver = items.every((item) => item.product.type !== 'physical' || ['free', 'paid'].includes(item.product.deliveryMode || 'arrange'));
  const [deliveryMethod, setDeliveryMethod] = useState(() => canDeliver ? 'delivery' : 'pickup');
  const [deliveryStreet, setDeliveryStreet] = useState(user?.address || '');
  const [deliveryCity, setDeliveryCity] = useState(user?.city || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const offeredShipping = items.reduce((sum, item) => sum + (item.product.deliveryMode === 'paid' ? Number(item.product.deliveryFee || 0) : 0), 0);
  const shippingCost = deliveryMethod === 'delivery' ? offeredShipping : 0;
  const finalTotal = total + shippingCost;

  // Un pedido por tienda: el carrito puede mezclar productos de varias
  const storeGroups = useMemo(() => {
    const groups = new Map<string, { storeName: string; items: typeof items; subtotal: number }>();
    for (const item of items) {
      const product = item.product as typeof item.product & { seller?: { id?: string; storeName?: string }; storeName?: string };
      const key = product.sellerId || product.seller?.id || 'tienda';
      const storeName = product.seller?.storeName || product.storeName || 'Tienda';
      const group = groups.get(key) || { storeName, items: [] as typeof items, subtotal: 0 };
      group.items.push(item);
      group.subtotal += item.product.price * item.quantity;
      groups.set(key, group);
    }
    return [...groups.values()];
  }, [items]);

  const handleCheckout = async () => {
    if (hasDemoProducts) {
      toast.error('Quitá los productos de muestra antes de continuar');
      navigate('/carrito');
      return;
    }
    if (deliveryMethod === 'delivery' && !canDeliver) {
      toast.error('Hay productos cuyo envío debe coordinarse con el vendedor. Elegí retiro en tienda.');
      return;
    }
    if (deliveryMethod === 'delivery' && needsAddress && (!deliveryStreet.trim() || !deliveryCity.trim())) {
      toast.error('Completá la dirección y la ciudad para recibir el pedido');
      return;
    }
    if (paymentMethod === 'wallet' && (wallet?.balance || 0) < finalTotal) {
      toast.error('Saldo insuficiente en tu wallet');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        visitorId: getVisitorId(), // atribución de afiliados (el servidor valida los clics)
        deliveryType: deliveryMethod,
        deliveryAddress: {
          street: deliveryStreet.trim(),
          number: '',
          city: deliveryCity.trim(),
        },
        deliveryNotes: deliveryNotes.trim(),
        paymentMethod,
        expectedTotal: finalTotal,
      };

      const { orders } = await ordersApi.checkout(orderData);

      clearCart();
      toast.success(orders.length > 1
        ? `¡Compra realizada! Se generaron ${orders.length} pedidos, uno por tienda.`
        : '¡Compra realizada con éxito!');
      navigate('/app/pedidos');

      if (paymentMethod === 'wallet') {
        const { fetchWallet } = useWalletStore.getState();
        if (user?.id) fetchWallet(user.id);
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la compra');
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

  if (hasDemoProducts) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center">
        <h1 className="text-2xl font-black text-blue-950">Hay productos de muestra en tu carrito</h1>
        <p className="mt-3 text-sm leading-relaxed text-blue-800">
          El catálogo demo sirve para probar el carrito. Quitá esos productos para comprar los productos reales.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/carrito')}>Revisar carrito</Button>
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
            {storeGroups.length > 1 && (
              <p className="text-xs text-muted-foreground mb-3">
                Tu carrito tiene productos de {storeGroups.length} tiendas: se va a generar un pedido para cada una.
              </p>
            )}
            <div className="space-y-4">
              {storeGroups.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  {storeGroups.length > 1 && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.storeName}</p>
                  )}
                  {group.items.map((item) => (
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
                    <RadioGroupItem value={method.id} id={method.id} disabled={method.id === 'delivery' && !canDeliver} />
                    <Label htmlFor={method.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                      <method.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{method.label}</p>
                      </div>
                      <span className="font-medium text-foreground">{method.id === 'pickup' ? 'Sin costo' : !canDeliver ? 'A coordinar' : offeredShipping > 0 ? formatCurrency(offeredShipping) : 'Gratis'}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {!canDeliver && <p className="mt-3 text-xs text-muted-foreground">Uno o más vendedores todavía no fijaron un costo de envío. Podés retirar en tienda o contactarles antes de comprar.</p>}
            {deliveryMethod === 'delivery' && needsAddress && <div className="mt-5 grid gap-3 border-t border-border pt-4"><h4 className="font-semibold text-foreground">Dirección de entrega</h4><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="delivery-street">Calle y número *</Label><Input id="delivery-street" value={deliveryStreet} onChange={(event) => setDeliveryStreet(event.target.value)} placeholder="Dirección completa" /></div><div className="space-y-1"><Label htmlFor="delivery-city">Ciudad *</Label><Input id="delivery-city" value={deliveryCity} onChange={(event) => setDeliveryCity(event.target.value)} placeholder="Ciudad" /></div></div><div className="space-y-1"><Label htmlFor="delivery-notes">Indicaciones para el repartidor</Label><Textarea id="delivery-notes" value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} placeholder="Referencia o indicaciones opcionales" rows={2} /></div></div>}
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
          <p className="mb-3 text-right text-xs text-muted-foreground">Envío: {shippingCost ? formatCurrency(shippingCost) : 'sin costo'}</p>
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
