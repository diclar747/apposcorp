import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getOrderStatusInfo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const statusFilters = [
  { value: 'all', label: 'Todos', icon: Package },
  { value: 'pending', label: 'Pendientes', icon: Clock },
  { value: 'confirmed', label: 'Confirmados', icon: CheckCircle },
  { value: 'preparing', label: 'En preparación', icon: Package },
  { value: 'ready', label: 'Listos', icon: CheckCircle },
  { value: 'shipped', label: 'En camino', icon: Truck },
  { value: 'delivered', label: 'Entregados', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelados', icon: XCircle },
];

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getAll('admin');
      setOrders(data);
    } catch (error) {
      toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success('Estado actualizado');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await ordersApi.getById(orderId);
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const filteredOrders = orders.filter(order => {
    const buyerName = `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.toLowerCase();
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          buyerName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona todos los pedidos del sistema</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusFilters.slice(1, 5).map((status) => {
          const count = orders.filter(o => o.status === status.value).length;
          return (
            <Card key={status.value}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <status.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">{status.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de orden o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status.value)}
                  size="sm"
                >
                  <status.icon className="w-4 h-4 mr-1" />
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                      <p className="mt-2 text-gray-500">Cargando pedidos...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <TableCell>
                          <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{order.id.slice(-8)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.buyer?.avatar && <img src={order.buyer.avatar} alt="" className="w-8 h-8 rounded-full" />}
                            <span className="text-sm">{order.buyer?.firstName} {order.buyer?.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{order.seller?.sellerProfile?.storeName || 'Tienda Oscorp'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalle del Pedido {order.orderNumber}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Order Details */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Cliente</p>
                                    <p className="font-medium">{order.buyer?.firstName} {order.buyer?.lastName}</p>
                                    <p className="text-sm text-gray-600">{order.buyer?.email}</p>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Tienda / Vendedor</p>
                                    <p className="font-medium">{order.seller?.sellerProfile?.storeName || 'Oscorp'}</p>
                                    <p className="text-sm text-gray-600">{order.seller?.firstName} {order.seller?.lastName}</p>
                                  </div>
                                </div>
                                
                                {/* Items */}
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Productos</p>
                                  <div className="space-y-2">
                                    {order.items?.map((item: any) => (
                                      <div key={item.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                                        {item.productImage ? (
                                          <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{item.productName}</p>
                                          <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                                        </div>
                                        <p className="font-bold">{formatCurrency(item.total)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Status History */}
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Historial de Estados</p>
                                  <div className="space-y-2">
                                    {order.trackingHistory?.map((event: any) => (
                                      <div key={event.id} className="flex gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                                        <div>
                                          <p className="font-bold">{getOrderStatusInfo(event.status).label}</p>
                                          <p className="text-gray-500">{event.description}</p>
                                          <p className="text-[10px] text-gray-400">{formatDateTime(event.timestamp)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Envío</span>
                                    <span>{formatCurrency(order.shippingCost)}</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold mt-2">
                                    <span className="text-blue-600">Total</span>
                                    <span className="text-blue-600">{formatCurrency(order.total)}</span>
                                  </div>
                                </div>
                                
                                {/* Actions Area */}
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                  <p className="text-xs font-bold text-blue-800 mb-3 uppercase">Gestión de Orden (Admin)</p>
                                  <div className="flex flex-wrap gap-2">
                                    {order.status === 'pending' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'confirmed')}>Confirmar</Button>}
                                    {order.status === 'confirmed' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'preparing')}>Preparar</Button>}
                                    {order.status === 'preparing' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'ready')}>Listo</Button>}
                                    {order.status === 'ready' && <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'shipped')}>Enviar</Button>}
                                    {order.status === 'shipped' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'delivered')}>Entregado</Button>}
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'cancelled')}>Cancelar</Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
