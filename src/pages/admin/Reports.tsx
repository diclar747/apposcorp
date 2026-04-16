import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Wallet,
  Search, Loader2, ChevronLeft, ChevronRight,
  ShoppingCart, Users, Package, CreditCard,
  FileText, FileSpreadsheet, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { ordersApi, productsApi, usersApi, walletApi, creditsApi } from '@/lib/api';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Labels / Maps ───────────────────────────────────────────────────
const ORDER_STATUS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  ready: 'Listo', in_transit: 'En camino', delivered: 'Entregado',
  cancelled: 'Cancelado', refunded: 'Reembolsado',
};
const TX_TYPE: Record<string, string> = {
  deposit: 'Depósito', withdrawal: 'Retiro', purchase: 'Compra', sale: 'Venta',
  transfer_in: 'Transfer. Recibida', transfer_out: 'Transfer. Enviada',
  commission: 'Comisión', income: 'Ingreso', expense: 'Egreso',
  credit: 'Crédito', fee: 'Tarifa',
};
const CREDIT_STATUS: Record<string, string> = {
  pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado',
  active: 'Activo', completed: 'Completado', defaulted: 'En Mora', cancelled: 'Cancelado',
};
const PIE_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

// ─── Helpers ─────────────────────────────────────────────────────────
function downloadExcel(data: Record<string, any>[], filename: string) {
  if (!data.length) {
    const ws = XLSX.utils.aoa_to_sheet([['Sin datos']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, filename);
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, filename);
}


function matchesDateRange(dateStr: string, start: string, end: string): boolean {
  if (!start && !end) return true;
  const d = new Date(dateStr).getTime();
  if (start && d < new Date(start).getTime()) return false;
  if (end && d > new Date(end + 'T23:59:59').getTime()) return false;
  return true;
}

// ─── Component ───────────────────────────────────────────────────────
export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination per tab
  const [ordersPage, setOrdersPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [ord, prod, usr, tx, cred] = await Promise.all([
          ordersApi.getAll('admin').catch(() => []),
          productsApi.getAll().catch(() => []),
          usersApi.getAll().catch(() => []),
          walletApi.getAllTransactions().catch(() => []),
          creditsApi.getAllAdmin().catch(() => []),
        ]);
        setOrders(Array.isArray(ord) ? ord : []);
        setProducts(Array.isArray(prod) ? prod : []);
        setUsers(Array.isArray(usr) ? usr : []);
        setTransactions(Array.isArray(tx) ? tx : []);
        setCredits(Array.isArray(cred) ? cred : []);
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
        const buyerName = `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`.toLowerCase();
        const sellerName = `${o.seller?.firstName || ''} ${o.seller?.lastName || ''}`.toLowerCase();
        if (!buyerName.includes(q) && !sellerName.includes(q) && !(o.orderNumber || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, category, searchQuery]);

  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (!matchesDateRange(t.createdAt, startDate, endDate)) return false;
      if (category !== 'all' && t.type !== category) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
        if (!name.includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate, category, searchQuery]);

  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      if (!matchesDateRange(c.createdAt, startDate, endDate)) return false;
      if (category !== 'all' && c.status !== category) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
        if (!name.includes(q) && !(c.concept || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [credits, startDate, endDate, category, searchQuery]);

  // ─── KPI calculations ─────────────────────────────────────────────
  const totalSales = filteredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalCommissions = filteredOrders.reduce((s: number, o: any) => s + (o.commissionAmount || 0), 0);
  const totalSellerEarnings = filteredOrders.reduce((s: number, o: any) => s + (o.sellerEarnings || 0), 0);
  const totalCreditAmount = filteredCredits.filter((c: any) => ['active', 'approved', 'completed'].includes(c.status)).reduce((s: number, c: any) => s + (c.amount || 0), 0);

  // ─── Chart data ───────────────────────────────────────────────────
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o: any) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: ORDER_STATUS[k] || k, value: v }));
  }, [filteredOrders]);

  const dailySales = useMemo(() => {
    const map: Record<string, { date: string; ventas: number; comisiones: number }> = {};
    filteredOrders.forEach((o: any) => {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      if (!map[day]) map[day] = { date: day, ventas: 0, comisiones: 0 };
      map[day].ventas += o.total || 0;
      map[day].comisiones += o.commissionAmount || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const txByType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx.forEach((t: any) => { map[t.type] = (map[t.type] || 0) + Math.abs(t.amount); });
    return Object.entries(map).map(([k, v]) => ({ name: TX_TYPE[k] || k, value: v }));
  }, [filteredTx]);

  // ─── Paginated data ───────────────────────────────────────────────
  const ordersPageData = filteredOrders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE);
  const ordersTotalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const txPageData = filteredTx.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);
  const txTotalPages = Math.ceil(filteredTx.length / PAGE_SIZE);

  // ─── Export functions ─────────────────────────────────────────────
  const exportOrdersCSV = () => {
    const data = filteredOrders.map((o: any) => ({
      'Nro. Orden': o.orderNumber,
      'Fecha': formatDate(o.createdAt),
      'Comprador': `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`,
      'Vendedor': `${o.seller?.firstName || ''} ${o.seller?.lastName || ''}`,
      'Productos': o.items?.length || 0,
      'Subtotal': o.subtotal,
      'Comisión': o.commissionAmount,
      'Ganancia Vendedor': o.sellerEarnings,
      'Total': o.total,
      'Estado': ORDER_STATUS[o.status] || o.status,
      'Método Pago': o.paymentMethod,
      'Tipo Entrega': o.deliveryType === 'delivery' ? 'Delivery' : 'Retiro',
    }));
    downloadExcel(data, `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte de ventas exportado a Excel');
  };

  const exportTransactionsCSV = () => {
    const data = filteredTx.map((t: any) => ({
      'Fecha': formatDate(t.createdAt),
      'Tipo': TX_TYPE[t.type] || t.type,
      'Usuario': `${t.user?.firstName || ''} ${t.user?.lastName || ''}`,
      'Email': t.user?.email || '',
      'Descripción': t.description,
      'Monto': t.amount,
      'Estado': t.status,
    }));
    downloadExcel(data, `reporte-transacciones-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte de transacciones exportado a Excel');
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
    downloadExcel(data, `reporte-productos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte de productos exportado a Excel');
  };

  const exportCreditsCSV = () => {
    const data = filteredCredits.map((c: any) => ({
      'Fecha': formatDate(c.createdAt),
      'Usuario': `${c.user?.firstName || ''} ${c.user?.lastName || ''}`,
      'Concepto': c.concept,
      'Monto': c.amount,
      'Cuotas': c.installments,
      'Cuota Mensual': c.installmentAmount,
      'Total a Pagar': c.totalToPay,
      'Tasa Interés': `${c.interestRate}%`,
      'Estado': CREDIT_STATUS[c.status] || c.status,
    }));
    downloadExcel(data, `reporte-creditos-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte de créditos exportado a Excel');
  };

  // PDF generators
  const exportOrdersPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo/Header
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('OSCORP PLATFORM', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE VENTAS', 15, 33);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PY')}`, pageWidth - 50, 25);

    // Render Stats
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Total Ventas: ${formatCurrency(totalSales)}`, 15, 48);
    doc.text(`Comisiones: ${formatCurrency(totalCommissions)}`, pageWidth / 2, 48);
    doc.text(`Ganancias Vendedores: ${formatCurrency(totalSellerEarnings)}`, 15, 54);
    doc.text(`Órdenes: ${filteredOrders.length}`, pageWidth / 2, 54);

    const tableData = filteredOrders.map((o: any) => [
      o.orderNumber || '',
      formatDate(o.createdAt),
      `${o.buyer?.firstName || ''} ${o.buyer?.lastName || ''}`,
      `${o.seller?.firstName || ''} ${o.seller?.lastName || ''}`,
      formatCurrency(o.total),
      formatCurrency(o.commissionAmount),
      ORDER_STATUS[o.status] || o.status
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Orden', 'Fecha', 'Comprador', 'Vendedor', 'Total', 'Comisión', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`ventas-oscorp-${new Date().getTime()}.pdf`);
    toast.success('PDF de ventas generado y descargando');
  };

  const exportTransactionsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo/Header
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('OSCORP PLATFORM', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE TRANSACCIONES', 15, 33);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PY')}`, pageWidth - 50, 25);

    // Stats
    const incomeTotal = filteredTx.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const expenseTotal = filteredTx.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Total Ingresos: ${formatCurrency(incomeTotal)}`, 15, 48);
    doc.text(`Total Egresos: ${formatCurrency(expenseTotal)}`, pageWidth / 2, 48);
    doc.text(`Transacciones: ${filteredTx.length}`, 15, 54);

    const tableData = filteredTx.map((t: any) => [
      formatDate(t.createdAt),
      TX_TYPE[t.type] || t.type,
      `${t.user?.firstName || ''} ${t.user?.lastName || ''}`,
      t.description || '',
      formatCurrency(t.amount),
      t.status
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Fecha', 'Tipo', 'Usuario', 'Descripción', 'Monto', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`transacciones-oscorp-${new Date().getTime()}.pdf`);
    toast.success('PDF de transacciones generado y descargando');
  };

  // ─── Dynamic filter options based on active tab ────────────────────
  const [activeTab, setActiveTab] = useState('ventas');
  const categoryOptions = useMemo(() => {
    if (activeTab === 'ventas') return Object.entries(ORDER_STATUS);
    if (activeTab === 'transacciones') return Object.entries(TX_TYPE);
    if (activeTab === 'creditos') return Object.entries(CREDIT_STATUS);
    return [];
  }, [activeTab]);

  // Reset pagination when filters change
  useEffect(() => { setOrdersPage(1); setTxPage(1); }, [startDate, endDate, category, searchQuery]);
  useEffect(() => { setCategory('all'); setSearchQuery(''); }, [activeTab]);

  // ─── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400">Análisis detallado de la plataforma Oscorp</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Ventas', value: formatCurrency(totalSales), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
          { label: 'Comisiones', value: formatCurrency(totalCommissions), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          { label: 'Órdenes', value: String(filteredOrders.length), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Usuarios', value: String(users.length), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Créditos Activos', value: formatCurrency(totalCreditAmount), icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
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
          <TabsTrigger value="transacciones" className="gap-1.5"><Wallet className="w-4 h-4" /> Transacciones</TabsTrigger>
          <TabsTrigger value="productos" className="gap-1.5"><Package className="w-4 h-4" /> Productos</TabsTrigger>
          <TabsTrigger value="creditos" className="gap-1.5"><CreditCard className="w-4 h-4" /> Créditos</TabsTrigger>
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
                <p className="text-xs text-gray-500">Comisiones</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totalCommissions)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Ganancias Vendedores</p>
                <p className="text-lg font-bold">{formatCurrency(totalSellerEarnings)}</p>
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
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Comprador</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Vendedor</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Total</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Comisión</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersPageData.length > 0 ? ordersPageData.map((o: any) => (
                        <tr key={o.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 font-mono text-xs">{o.orderNumber}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                          <td className="p-3">{o.buyer?.firstName} {o.buyer?.lastName}</td>
                          <td className="p-3">{o.seller?.firstName} {o.seller?.lastName}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(o.total)}</td>
                          <td className="p-3 text-right text-orange-600">{formatCurrency(o.commissionAmount)}</td>
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
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400">No se encontraron órdenes</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination current={ordersPage} total={ordersTotalPages} count={filteredOrders.length} pageSize={PAGE_SIZE} onPage={setOrdersPage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Transacciones Tab ───── */}
        <TabsContent value="transacciones">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportTransactionsCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportTransactionsPDF}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Transacciones</p>
                <p className="text-lg font-bold">{filteredTx.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Ingresos</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(filteredTx.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0))}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Egresos</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(filteredTx.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0))}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(filteredTx.reduce((s: number, t: any) => s + t.amount, 0))}</p>
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
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Usuario</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Descripción</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txPageData.length > 0 ? txPageData.map((t: any) => (
                        <tr key={t.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(t.createdAt)}</td>
                          <td className="p-3"><Badge variant="secondary" className="text-xs">{TX_TYPE[t.type] || t.type}</Badge></td>
                          <td className="p-3">{t.user?.firstName} {t.user?.lastName}</td>
                          <td className="p-3 max-w-[200px] truncate text-gray-600 dark:text-gray-300">{t.description}</td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className={`text-xs ${
                              t.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              t.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{t.status}</Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No se encontraron transacciones</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination current={txPage} total={txTotalPages} count={filteredTx.length} pageSize={PAGE_SIZE} onPage={setTxPage} />
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

        {/* ───── Créditos Tab ───── */}
        <TabsContent value="creditos">
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={exportCreditsCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Total Créditos</p>
                <p className="text-lg font-bold">{filteredCredits.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Monto Activo</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalCreditAmount)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">Pendientes</p>
                <p className="text-lg font-bold text-yellow-600">{filteredCredits.filter((c: any) => c.status === 'pending').length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-3">
                <p className="text-xs text-gray-500">En Mora</p>
                <p className="text-lg font-bold text-red-600">{filteredCredits.filter((c: any) => c.status === 'defaulted').length}</p>
              </CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Fecha</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Usuario</th>
                        <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Concepto</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Cuotas</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Cuota</th>
                        <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Total a Pagar</th>
                        <th className="text-center p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCredits.length > 0 ? filteredCredits.map((c: any) => (
                        <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDate(c.createdAt)}</td>
                          <td className="p-3">{c.user?.firstName} {c.user?.lastName}</td>
                          <td className="p-3 max-w-[160px] truncate">{c.concept}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(c.amount)}</td>
                          <td className="p-3 text-center">{c.installments}</td>
                          <td className="p-3 text-right">{formatCurrency(c.installmentAmount)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(c.totalToPay)}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className={`text-xs ${
                              c.status === 'active' || c.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              c.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              c.status === 'defaulted' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-600'
                            }`}>{CREDIT_STATUS[c.status] || c.status}</Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="p-8 text-center text-gray-400">No se encontraron créditos</td></tr>
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
                <CardTitle className="text-sm font-medium">Tendencia Diaria de Ventas</CardTitle>
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
                      <Line type="monotone" dataKey="comisiones" stroke="#f59e0b" name="Comisiones" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-center py-12">Sin datos para el período</p>}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Órdenes por Estado</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Transacciones por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  {txByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={txByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="value" fill="#3b82f6" name="Monto" radius={[0, 4, 4, 0]} />
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

// ─── Pagination Component ────────────────────────────────────────────
function Pagination({ current, total, count, pageSize, onPage }: {
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
