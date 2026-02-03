import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { mockOrders, mockUsers, mockStores } from '@/data/mockData';
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

const statusFilters = [
  { value: 'all', label: 'Todos', icon: Package },
  { value: 'pending', label: 'Pendientes', icon: Clock },
  { value: 'preparing', label: 'En preparación', icon: Package },
  { value: 'in_transit', label: 'En camino', icon: Truck },
  { value: 'delivered', label: 'Entregados', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelados', icon: XCircle },
];

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mockUsers.find(u => u.id === order.buyerId)?.firstName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500">Gestiona todos los pedidos del sistema</p>
        </div>
        <Button variant="outline">Exportar pedidos</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusFilters.slice(1).map((status) => {
          const count = mockOrders.filter(o => o.status === status.value).length;
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
                {filteredOrders.map((order, index) => {
                  const buyer = mockUsers.find(u => u.id === order.buyerId);
                  const store = mockStores.find(s => s.id === order.storeId);
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
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.id}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={buyer?.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <span className="text-sm">{buyer?.firstName} {buyer?.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{store?.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{order.items.length} items</span>
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
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Pedido {order.orderNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Order Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Cliente</p>
                                  <p className="font-medium">{buyer?.firstName} {buyer?.lastName}</p>
                                  <p className="text-sm text-gray-600">{buyer?.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Tienda</p>
                                  <p className="font-medium">{store?.name}</p>
                                  <p className="text-sm text-gray-600">{store?.phone}</p>
                                </div>
                              </div>
                              
                              {/* Items */}
                              <div>
                                <p className="text-sm text-gray-500 mb-2">Productos</p>
                                <div className="space-y-2">
                                  {order.items.map((item) => (
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
                                  <span>Total</span>
                                  <span>{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex gap-2">
                                {order.status === 'pending' && (
                                  <Button className="flex-1">Confirmar pedido</Button>
                                )}
                                {order.status === 'confirmed' && (
                                  <Button className="flex-1">Marcar en preparación</Button>
                                )}
                                {order.status === 'preparing' && (
                                  <Button className="flex-1">Marcar listo</Button>
                                )}
                                {order.status === 'ready' && (
                                  <Button className="flex-1">Enviar pedido</Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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
