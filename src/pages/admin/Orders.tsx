import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, Clock, Loader2, Download } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getOrderStatusInfo, cn, generateReportPDF } from '@/lib/utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const exportToPDF = () => {
    const statsHtml = `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">TOTAL PEDIDOS</div>
          <div class="stat-value">${orders.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">CONFIRMADOS</div>
          <div class="stat-value">${orders.filter(o => o.status === 'confirmed').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">ENTREGADOS</div>
          <div class="stat-value text-green">${orders.filter(o => o.status === 'delivered').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">TOTAL GENERAL</div>
          <div class="stat-value font-bold">${formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</div>
        </div>
      </div>
    `;

    const rows = filteredOrders.map(o => {
      const statusInfo = getOrderStatusInfo(o.status);
      let statusClass = 'badge-gray';
      if (o.status === 'delivered') statusClass = 'badge-green';
      if (o.status === 'pending') statusClass = 'badge-yellow';
      if (o.status === 'cancelled') statusClass = 'badge-red';

      return `
        <tr>
          <td>${o.orderNumber}</td>
          <td>${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}</td>
          <td>${o.seller?.sellerProfile?.storeName || 'Tienda Oscorp'}</td>
          <td class="text-center">${o.items?.length || 0}</td>
          <td class="font-bold">${formatCurrency(o.total)}</td>
          <td><span class="badge ${statusClass}">${statusInfo.label}</span></td>
          <td>${formatDateTime(o.createdAt)}</td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Tienda</th>
            <th class="text-center">Items</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    generateReportPDF('Reporte de Pedidos', statsHtml, tableHtml);
    toast.success('Reporte de pedidos generado');
  };

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
    <div className="space-y-2 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Pedidos</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Gestiona todos los pedidos del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF} className="h-8 text-xs rounded-lg">
            <Download className="w-3 h-3 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading} className="h-8 text-xs rounded-lg">
            {isLoading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusFilters.slice(1, 5).map((status, index) => {
          const count = orders.filter(o => o.status === status.value).length;
          const colors = [
            'bg-amber-500 text-amber-500',
            'bg-blue-500 text-blue-500',
            'bg-purple-500 text-purple-500',
            'bg-emerald-500 text-emerald-500'
          ];
          const currentColor = colors[index % colors.length];
          
          return (
            <motion.div
              key={status.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="dark:bg-[#0f172a] dark:border-slate-800/50 border-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <status.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">{count}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{status.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="dark:bg-slate-900/50 dark:border-slate-800 border-slate-200 shadow-sm">
        <CardContent className="p-2">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 lg:max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-[11px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-[11px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md focus:ring-blue-500">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3 h-3 text-slate-400" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-md">
                    {statusFilters.map((status) => (
                      <SelectItem 
                        key={status.value} 
                        value={status.value}
                        className="dark:focus:bg-slate-800 cursor-pointer rounded-md mx-1 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <status.icon className="w-3 h-3 text-slate-400" />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="dark:bg-slate-900/50 dark:border-slate-800 border-slate-200 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Pedido</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Cliente</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Tienda</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none text-center">Items</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Total</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none text-center">Estado</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Fecha</TableHead>
                  <TableHead className="py-2.5 px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none text-right">Acciones</TableHead>
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
                        className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="py-2.5 px-6">
                          <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{order.orderNumber}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{order.id.slice(-12).toUpperCase()}</p>
                        </TableCell>
                        <TableCell className="py-2.5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-blue-600 overflow-hidden shrink-0">
                              {order.buyer?.avatar ? <img src={order.buyer.avatar} className="w-full h-full object-cover" /> : order.buyer?.firstName?.charAt(0)}
                            </div>
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{order.buyer?.firstName} {order.buyer?.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-6">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px] block">{order.seller?.sellerProfile?.storeName || 'Tienda Oscorp'}</span>
                        </TableCell>
                        <TableCell className="py-2.5 px-6 text-center">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {order.items?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 px-6">
                          <span className="font-black text-sm text-slate-900 dark:text-white">{formatCurrency(order.total)}</span>
                        </TableCell>
                        <TableCell className="py-2 px-6 text-center">
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-[9px] font-bold px-2 h-4`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-6">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{formatDateTime(order.createdAt).split(' ')[0]}</span>
                            <span className="text-[9px] text-slate-500">{formatDateTime(order.createdAt).split(' ')[1]}</span>
                          </div>
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
                                  <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Cliente</p>
                                    <p className="font-medium">{order.buyer?.firstName} {order.buyer?.lastName}</p>
                                    <p className="text-sm text-gray-600">{order.buyer?.email}</p>
                                  </div>
                                  <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
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
                                          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
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
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
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
