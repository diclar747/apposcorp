import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  MapPin,
  Phone,
  MessageCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockOrders, mockStores, mockUsers } from '@/data/mockData';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statusSteps = [
  { status: 'pending', label: 'Pedido recibido', icon: Clock },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle },
  { status: 'preparing', label: 'En preparación', icon: Package },
  { status: 'in_transit', label: 'En camino', icon: Truck },
  { status: 'delivered', label: 'Entregado', icon: CheckCircle },
];

export default function ClientOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const order = mockOrders.find(o => o.id === id && o.buyerId === user?.id);
  const store = order ? mockStores.find(s => s.id === order.storeId) : null;
  const seller = order ? mockUsers.find(u => u.id === order.sellerId) : null;

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pedido no encontrado</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Volver</Button>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(s => s.status === order.status);
  const statusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-xl flex items-center justify-center`}>
                <Package className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 mb-1`}>
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-gray-500">
                  {order.status === 'delivered' 
                    ? `Entregado el ${formatDateTime(order.actualDelivery || order.updatedAt)}`
                    : 'Tu pedido está en camino'
                  }
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-center gap-4 py-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <StepIcon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-gray-500">En progreso</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Envío</span>
                <span>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-3">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Info */}
      {store && (
        <div className="px-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Información de la tienda</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{store.name}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>{store.phone}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Contactar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <div className="px-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Dirección de entrega</h3>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{order.deliveryAddress.street} {order.deliveryAddress.number}</p>
                  {order.deliveryAddress.apartment && (
                    <p className="text-sm text-gray-500">Apto: {order.deliveryAddress.apartment}</p>
                  )}
                  <p className="text-sm text-gray-500">{order.deliveryAddress.city}</p>
                  {order.deliveryAddress.reference && (
                    <p className="text-sm text-gray-500 mt-1">Ref: {order.deliveryAddress.reference}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
