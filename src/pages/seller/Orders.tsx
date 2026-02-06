import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, ArrowRight, Loader2 } from 'lucide-react';
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

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  { value: 'preparing', label: 'En preparación', color: 'bg-purple-100 text-purple-700' },
  { value: 'ready', label: 'Listo', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'in_transit', label: 'En camino', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-700' },
];

export default function SellerOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getAll('seller');
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

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
      await ordersApi.updateStatus(orderId, newStatus, `Estado cambiado a ${statusLabel}`);
      toast.success(`Pedido actualizado a "${statusLabel}"`);
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar pedido');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500">Gestiona los pedidos de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.slice(0, 4).map((status) => {
          const count = orders.filter((o: any) => o.status === status.value).length;
          return (
            <Card key={status.value}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{status.label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
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
                placeholder="Buscar por número de orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} size="sm">Todos</Button>
              {statusOptions.map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status.value)}
                  size="sm"
                >
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
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay pedidos
                    </TableCell>
                  </TableRow>
                )}
                {filteredOrders.map((order: any, index: number) => {
                  const buyer = order.buyer;
                  const statusInfo = getOrderStatusInfo(order.status);
                  const currentStatusIndex = statusOptions.findIndex(s => s.value === order.status);
                  const nextStatus = statusOptions[currentStatusIndex + 1];

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {buyer?.avatar && <img src={buyer.avatar} alt="" className="w-8 h-8 rounded-full" />}
                          <span className="text-sm">{buyer?.firstName} {buyer?.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{order.items?.length || 0} items</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(order.id, nextStatus.value)}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  {nextStatus.label}
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Pedido {order.orderNumber}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Cliente</p>
                                    <p className="font-medium">{buyer?.firstName} {buyer?.lastName}</p>
                                    <p className="text-sm text-gray-600">{buyer?.phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Dirección</p>
                                    <p className="font-medium">{order.deliveryAddress?.street} {order.deliveryAddress?.number}</p>
                                    <p className="text-sm text-gray-600">{order.deliveryAddress?.city}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 mb-2">Productos</p>
                                  <div className="space-y-2">
                                    {order.items?.map((item: any) => (
                                      <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        {item.productImage && (
                                          <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{item.productName}</p>
                                          <p className="text-sm text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.total)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                  </div>
                                  {order.commissionAmount > 0 && (
                                    <div className="flex justify-between text-sm text-gray-500">
                                      <span>Comisión plataforma</span>
                                      <span>-{formatCurrency(order.commissionAmount)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-lg font-bold mt-2">
                                    <span>Tu ganancia</span>
                                    <span className="text-green-600">{formatCurrency(order.sellerEarnings)}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
