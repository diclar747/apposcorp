import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockOrders, mockStores } from '@/data/mockData';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_transit', label: 'En camino' },
  { value: 'delivered', label: 'Entregados' },
];

export default function ClientOrders() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const userOrders = mockOrders.filter(o => o.buyerId === user?.id);
  
  const filteredOrders = userOrders.filter(order => {
    return statusFilter === 'all' || order.status === statusFilter;
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
        <p className="text-sm text-gray-500">Seguimiento de tus compras</p>
      </div>

      {/* Filters */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusFilters.map((status) => (
            <Button
              key={status.value}
              variant={statusFilter === status.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status.value)}
              size="sm"
              className="whitespace-nowrap"
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-3">
        {filteredOrders.map((order, index) => {
          const store = mockStores.find(s => s.id === order.storeId);
          const statusInfo = getOrderStatusInfo(order.status);
          
          return (
            <Link key={order.id} to={`/app/pedidos/${order.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Store */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                        {store?.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{store?.name}</span>
                    </div>

                    {/* Products */}
                    <div className="flex gap-2 mb-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-sm text-gray-500">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">{order.items.length} productos</p>
                        <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tienes pedidos</h3>
          <p className="text-gray-500 mb-4">Comienza a comprar en la tienda</p>
          <Link to="/app/tienda">
            <Button>Ir a la tienda</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
