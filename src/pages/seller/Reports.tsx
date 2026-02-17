import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Wallet,
  Search, Loader2, ChevronLeft, ChevronRight,
  ShoppingCart, Package, Users as UsersIcon,
  FileText, FileSpreadsheet, BarChart3, Receipt,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { ordersApi, productsApi, customersApi, purchasesApi, managementApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ─── Labels ──────────────────────────────────────────────────────────
const ORDER_STATUS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  ready: 'Listo', in_transit: 'En camino', delivered: 'Entregado',
  cancelled: 'Cancelado', refunded: 'Reembolsado',
};
const PIE_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

// ─── Helpers ─────────────────────────────────────────────────────────
function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function generatePDF(title: string, statsHtml: string, tableHtml: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#333;font-size:12px}
      h1{font-size:20px;margin-bottom:4px}
      .date{color:#666;font-size:11px;margin-bottom:16px}
      .stats{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
      .stat{background:#f5f5f5;padding:10px 14px;border-radius:8px;min-width:120px}
      .stat-label{font-size:10px;color:#666}
      .stat-value{font-size:16px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}
      th{background:#f0f0f0;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd}
      td{padding:5px 8px;border-bottom:1px solid #eee}
      tr:nth-child(even){background:#fafafa}
      .text-right{text-align:right}
      .text-green{color:#16a34a}
      .text-red{color:#dc2626}
      @media print{body{padding:0}.no-print{display:none}}
    </style></head><body>
    <h1>${title} - Mi Tienda</h1>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}</p>
    ${statsHtml}
    ${tableHtml}
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function matchesDateRange(dateStr: string, start: string, end: string): boolean {
  if (!start && !end) return true;
  const d = new Date(dateStr).getTime();
  if (start && d < new Date(start).getTime()) return false;
  if (end && d > new Date(end + 'T23:59:59').getTime()) return false;
  return true;
}

// ─── Component ───────────────────────────────────────────────────────
export default function SellerReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [ord, prod, cust, purch, mov] = await Promise.all([
          ordersApi.getAll('seller').catch(() => []),
          productsApi.getAll().catch(() => []),
          customersApi.getAll().catch(() => []),
          purchasesApi.getAll().catch(() => []),
          managementApi.getMovements().catch(() => []),
        ]);
        setOrders(Array.isArray(ord) ? ord : []);
        setProducts(Array.isArray(prod) ? prod : []);
        setCustomers(Array.isArray(cust) ? cust : []);
        setPurchases(Array.isArray(purch) ? purch : []);
        setMovements(Array.isArray(mov) ? mov : []);
      } catch (err) {
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Filtered data ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!matchesDateRange(o.createdAt, startDate, endDate)) return false;
      if (category !== 'all' && o.status !== category) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`.toLowerCase();
        if (!name.includes(q) && !(o.orderNumber || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, category, searchQuery]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (!matchesDateRange(m.date || m.createdAt, startDate, endDate)) return false;
      if (category !== 'all' && m.type !== category) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(m.description || '').toLowerCase().includes(q) && !(m.category?.name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [movements, startDate, endDate, category, searchQuery]);

  // ─── KPIs ─────────────────────────────────────────────────────────
  const totalSales = filteredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalEarnings = filteredOrders.reduce((s: number, o: any) => s + (o.sellerEarnings || 0), 0);
  const totalCommissions = filteredOrders.reduce((s: number, o: any) => s + (o.commissionAmount || 0), 0);

  const movIncome = filteredMovements.filter((m: any) => m.type === 'income').reduce((s: number, m: any) => s + m.amount, 0);
  const movExpense = filteredMovements.filter((m: any) => m.type === 'expense').reduce((s: number, m: any) => s + m.amount, 0);

  // ─── Chart data ───────────────────────────────────────────────────
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o: any) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: ORDER_STATUS[k] || k, value: v }));
  }, [filteredOrders]);

  const dailySales = useMemo(() => {
    const map: Record<string, { date: string; ventas: number; ganancias: number }> = {};
    filteredOrders.forEach((o: any) => {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      if (!map[day]) map[day] = { date: day, ventas: 0, ganancias: 0 };
      map[day].ventas += o.total || 0;
      map[day].ganancias += o.sellerEarnings || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const productsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p: any) => { map[p.category] = (map[p.category] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, [products]);

  // ─── Pagination ───────────────────────────────────────────────────
  const ordersPageData = filteredOrders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE);
  const ordersTotalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const movPageData = filteredMovements.slice((movPage - 1) * PAGE_SIZE, movPage * PAGE_SIZE);
  const movTotalPages = Math.ceil(filteredMovements.length / PAGE_SIZE);

  // ─── Exports ──────────────────────────────────────────────────────
  const exportOrdersCSV = () => {
    const data = filteredOrders.map((o: any) => ({
      'Nro. Orden': o.orderNumber,
      'Fecha': formatDate(o.createdAt),
      'Cliente': `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`,
      'Productos': o.items?.length || 0,
      'Subtotal': o.subtotal,
      'Comisión': o.commissionAmount,
      'Ganancia': o.sellerEarnings,
      'Total': o.total,
      'Estado': ORDER_STATUS[o.status] || o.status,
      'Método Pago': o.paymentMethod,
      'Tipo Entrega': o.deliveryType === 'delivery' ? 'Delivery' : 'Retiro',
    }));
    downloadCSV(data, `reporte-ventas-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte de ventas exportado');
  };

  const exportProductsCSV = () => {
    const data = products.map((p: any) => ({
      'SKU': p.sku,
      'Nombre': p.name,
      'Categoría': p.category,
      'Precio': p.price,
      'Costo': p.cost || 0,
      'Ganancia %': p.profitPercentage || 0,
      'Stock': p.stock,
      'Estado': p.status,
      'Tipo': p.type,
      'Visibilidad': p.visibility,
    }));
    downloadCSV(data, `reporte-productos-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte de productos exportado');
  };

  const exportFinancialCSV = () => {
    const data = filteredMovements.map((m: any) => ({
      'Fecha': formatDate(m.date || m.createdAt),
      'Tipo': m.type === 'income' ? 'Ingreso' : 'Egreso',
      'Categoría': m.category?.name || '',
      'Descripción': m.description,
      'Monto': m.amount,
      'Comprobante': m.voucherNumber || '',
    }));
    downloadCSV(data, `reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte financiero exportado');
  };

  const exportCustomersCSV = () => {
    const data = customers.map((c: any) => ({
      'Nombre': c.fullName,
      'Teléfono': c.phone || '',
      'RUC': c.ruc || '',
      'Dirección': c.address || '',
      'Ciudad': c.city || '',
      'Notas': c.notes || '',
      'Estado': c.isActive ? 'Activo' : 'Inactivo',
    }));
    downloadCSV(data, `reporte-clientes-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte de clientes exportado');
  };

  const exportPurchasesCSV = () => {
    const data = purchases.map((p: any) => ({
      'Factura': p.invoiceNumber,
      'Fecha': formatDate(p.purchaseDate),
      'Proveedor': p.supplier?.name || '',
      'Items': p.items?.length || 0,
      'Total': p.totalAmount,
      'Estado': p.status,
      'Notas': p.notes || '',
    }));
    downloadCSV(data, `reporte-compras-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Reporte de compras exportado');
  };

  // PDF
  const exportOrdersPDF = () => {
    const statsHtml = `<div class="stats">
      <div class="stat"><div class="stat-label">Total Ventas</div><div class="stat-value">${formatCurrency(totalSales)}</div></div>
      <div class="stat"><div class="stat-label">Ganancias</div><div class="stat-value text-green">${formatCurrency(totalEarnings)}</div></div>
      <div class="stat"><div class="stat-label">Comisiones</div><div class="stat-value">${formatCurrency(totalCommissions)}</div></div>
      <div class="stat"><div class="stat-label">Pedidos</div><div class="stat-value">${filteredOrders.length}</div></div>
    </div>`;
    const rows = filteredOrders.map((o: any) => `<tr>
      <td>${o.orderNumber || ''}</td>
      <td>${formatDate(o.createdAt)}</td>
      <td>${(o.buyer?.firstName || '') + ' ' + (o.buyer?.lastName || '')}</td>
      <td class="text-right">${formatCurrency(o.total)}</td>
      <td class="text-right">${formatCurrency(o.sellerEarnings || 0)}</td>
      <td>${ORDER_STATUS[o.status] || o.status}</td>
    </tr>`).join('');
    const tableHtml = `<table><thead><tr><th>Orden</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Ganancia</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`;
    generatePDF('Reporte de Ventas', statsHtml, tableHtml);
    toast.success('PDF de ventas generado');
  };

  const exportFinancialPDF = () => {
    const statsHtml = `<div class="stats">
      <div class="stat"><div class="stat-label">Ingresos</div><div class="stat-value text-green">${formatCurrency(movIncome)}</div></div>
      <div class="stat"><div class="stat-label">Egresos</div><div class="stat-value text-red">${formatCurrency(movExpense)}</div></div>
      <div class="stat"><div class="stat-label">Balance</div><div class="stat-value">${formatCurrency(movIncome - movExpense)}</div></div>
    </div>`;
    const rows = filteredMovements.map((m: any) => `<tr>
      <td>${formatDate(m.date || m.createdAt)}</td>
      <td>${m.type === 'income' ? 'Ingreso' : 'Egreso'}</td>
      <td>${m.category?.name || ''}</td>
      <td>${m.description || ''}</td>
      <td class="text-right ${m.type === 'income' ? 'text-green' : 'text-red'}">${formatCurrency(m.amount)}</td>
    </tr>`).join('');
    const tableHtml = `<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th></tr></thead><tbody>${rows}</tbody></table>`;
    generatePDF('Reporte Financiero', statsHtml, tableHtml);
    toast.success('PDF financiero generado');
  };

  // ─── Dynamic filter options ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('ventas');
  const categoryOptions = useMemo(() => {
    if (activeTab === 'ventas') return Object.entries(ORDER_STATUS);
    if (activeTab === 'financiero') return [['income', 'Ingreso'], ['expense', 'Egreso']];
    return [];
  }, [activeTab]);

  useEffect(() => { setOrdersPage(1); setMovPage(1); }, [startDate, endDate, category, searchQuery]);
  useEffect(() => { setCategory('all'); setSearchQuery(''); }, [activeTab]);

  // ─── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400">Análisis detallado de tu tienda</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Ventas', value: formatCurrency(totalSales), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Ganancias', value: formatCurrency(totalEarnings), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Pedidos', value: String(filteredOrders.length), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Productos', value: String(products.length), icon: Package, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Clientes', value: String(customers.length), icon: UsersIcon, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{kpi.label}</p>
                    <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Fecha Inicio</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Fecha Fin</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Categoría / Estado</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {categoryOptions.map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Nombre, orden..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ventas" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Ventas</TabsTrigger>
          <TabsTrigger value="productos" className="gap-1.5"><Package className="w-4 h-4" /> Productos</TabsTrigger>
          <TabsTrigger value="financiero" className="gap-1.5"><Wallet className="w-4 h-4" /> Financiero</TabsTrigger>
          <TabsTrigger value="compras" className="gap-1.5"><Receipt className="w-4 h-4" /> Compras</TabsTrigger>
          <TabsTrigger value="graficos" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Gráficos</TabsTrigger>
        </TabsList>

        {/* ───── Ventas Tab ───── */}
        <TabsContent value="ventas">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportOrdersCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportOrdersPDF}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Ventas</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalSales)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Ganancias Netas</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalEarnings)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Comisiones</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totalCommissions)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Ticket Promedio</p>
                <p className="text-lg font-bold">{filteredOrders.length > 0 ? formatCurrency(totalSales / filteredOrders.length) : formatCurrency(0)}</p>
              </CardContent></Card>
            </div>

            <div className="flex flex-wrap gap-2">
              {ordersByStatus.map(s => (
                <Badge key={s.name} variant="secondary" className="text-xs">{s.name}: {s.value}</Badge>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Orden</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Cliente</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Total</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Comisión</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Ganancia</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersPageData.length > 0 ? ordersPageData.map((o: any) => (
                        <tr key={o.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                          <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(o.createdAt)}</td>
                          <td className="p-3">{o.buyer?.firstName} {o.buyer?.lastName}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(o.total)}</td>
                          <td className="p-3 text-right text-orange-600">{formatCurrency(o.commissionAmount)}</td>
                          <td className="p-3 text-right text-green-600 font-medium">{formatCurrency(o.sellerEarnings)}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className={`text-xs ${
                              o.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>{ORDER_STATUS[o.status] || o.status}</Badge>
                          </td>
                          <td className="p-3 text-center text-xs">{o.paymentMethod}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400">No se encontraron ventas</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationBar current={ordersPage} total={ordersTotalPages} count={filteredOrders.length} pageSize={PAGE_SIZE} onPage={setOrdersPage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Productos Tab ───── */}
        <TabsContent value="productos">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportProductsCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Productos</p>
                <p className="text-lg font-bold">{products.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Activos</p>
                <p className="text-lg font-bold text-green-600">{products.filter((p: any) => p.status === 'active').length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Stock Bajo (&lt;5)</p>
                <p className="text-lg font-bold text-red-600">{products.filter((p: any) => p.stock < 5).length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Valor Inventario</p>
                <p className="text-lg font-bold">{formatCurrency(products.reduce((s: number, p: any) => s + ((p.cost || p.price) * p.stock), 0))}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">SKU</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Producto</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Categoría</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Precio</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Costo</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Margen %</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Stock</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length > 0 ? products.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{p.sku}</td>
                          <td className="p-3 max-w-[180px] truncate">{p.name}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{p.category}</td>
                          <td className="p-3 text-right">{formatCurrency(p.price)}</td>
                          <td className="p-3 text-right text-gray-500">{formatCurrency(p.cost || 0)}</td>
                          <td className="p-3 text-right">{p.profitPercentage || 0}%</td>
                          <td className={`p-3 text-right font-medium ${p.stock < 5 ? 'text-red-600' : ''}`}>{p.stock}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className={`text-xs ${p.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                              {p.status === 'active' ? 'Activo' : p.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400">No se encontraron productos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Financiero Tab ───── */}
        <TabsContent value="financiero">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportFinancialCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportFinancialPDF}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(movIncome)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Egresos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(movExpense)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`text-lg font-bold ${movIncome - movExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(movIncome - movExpense)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Movimientos</p>
                <p className="text-lg font-bold">{filteredMovements.length}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Categoría</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Descripción</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movPageData.length > 0 ? movPageData.map((m: any) => (
                        <tr key={m.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(m.date || m.createdAt)}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className={`text-xs ${
                              m.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{m.type === 'income' ? 'Ingreso' : 'Egreso'}</Badge>
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{m.category?.name || '-'}</td>
                          <td className="p-3 max-w-[200px] truncate">{m.description}</td>
                          <td className={`p-3 text-right font-medium ${m.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {m.type === 'income' ? '+' : '-'}{formatCurrency(m.amount)}
                          </td>
                          <td className="p-3 text-gray-500 text-xs">{m.voucherNumber || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No se encontraron movimientos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationBar current={movPage} total={movTotalPages} count={filteredMovements.length} pageSize={PAGE_SIZE} onPage={setMovPage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Compras Tab ───── */}
        <TabsContent value="compras">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportPurchasesCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportCustomersCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Clientes CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Compras</p>
                <p className="text-lg font-bold">{purchases.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Monto Total</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(purchases.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0))}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Clientes</p>
                <p className="text-lg font-bold text-blue-600">{customers.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Clientes Activos</p>
                <p className="text-lg font-bold text-green-600">{customers.filter((c: any) => c.isActive).length}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Factura</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Proveedor</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Items</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Total</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.length > 0 ? purchases.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{p.invoiceNumber}</td>
                          <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(p.purchaseDate)}</td>
                          <td className="p-3">{p.supplier?.name || '-'}</td>
                          <td className="p-3 text-center">{p.items?.length || 0}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className={`text-xs ${
                              p.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800'
                            }`}>{p.status === 'completed' ? 'Completada' : p.status}</Badge>
                          </td>
                          <td className="p-3 text-gray-500 text-xs max-w-[120px] truncate">{p.notes || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-400">No se encontraron compras</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Gráficos Tab ───── */}
        <TabsContent value="graficos">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tendencia Diaria - Ventas y Ganancias</CardTitle>
              </CardHeader>
              <CardContent>
                {dailySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Fecha: ${l}`} />
                      <Legend />
                      <Line type="monotone" dataKey="ventas" stroke="#22c55e" name="Ventas" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="ganancias" stroke="#3b82f6" name="Ganancias" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-center py-12">Sin datos para el período</p>}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Pedidos por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={ordersByStatus} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100} dataKey="value">
                          {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-center py-12">Sin datos</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Productos por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productsByCategory} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" name="Productos" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-center py-12">Sin datos</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────
function PaginationBar({ current, total, count, pageSize, onPage }: {
  current: number; total: number; count: number; pageSize: number; onPage: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 border-t">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {((current - 1) * pageSize) + 1} - {Math.min(current * pageSize, count)} de {count}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {Array.from({ length: Math.min(5, total) }, (_, i) => {
          let p: number;
          if (total <= 5) p = i + 1;
          else if (current <= 3) p = i + 1;
          else if (current >= total - 2) p = total - 4 + i;
          else p = current - 2 + i;
          return (
            <Button key={p} variant={current === p ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => onPage(p)}>
              {p}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={current >= total} onClick={() => onPage(current + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
