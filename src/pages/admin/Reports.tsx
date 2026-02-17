import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Download, TrendingUp, TrendingDown, DollarSign, Wallet,
  Search, Filter, Loader2, ChevronLeft, ChevronRight,
  ShoppingCart, ArrowDownCircle, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, TableProperties, FileSpreadsheet,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Retiro',
  purchase: 'Compra',
  sale: 'Venta',
  transfer_in: 'Transfer. Recibida',
  transfer_out: 'Transfer. Enviada',
  commission: 'Comisión',
  income: 'Ingreso',
  expense: 'Egreso',
  credit: 'Crédito',
  fee: 'Tarifa',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
  failed: 'Fallido',
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchReport = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: pageSize };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await reportsApi.getFinancial(params);
      setReportData(data);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Error al cargar el reporte financiero');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, filterType, filterStatus, searchQuery]);

  useEffect(() => {
    fetchReport(1);
  }, []);

  const handleApplyFilters = () => {
    fetchReport(1);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      await reportsApi.exportCSV(params);
      toast.success('CSV exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    balanceGeneral = {},
    typeBreakdown = {},
    dailyTrend = [],
    orderSummary = {},
    withdrawalSummary = {},
    transactions = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } },
  } = reportData || {};

  // Prepare chart data
  const pieData = Object.entries(typeBreakdown).map(([key, val]: any) => ({
    name: TYPE_LABELS[key] || key,
    value: val.total,
  }));

  const barData = Object.entries(typeBreakdown).map(([key, val]: any) => ({
    name: TYPE_LABELS[key] || key,
    cantidad: val.count,
    monto: val.total,
  }));

  // Balance detail table
  const statusBreakdown: Record<string, number> = {};
  if (transactions.data) {
    for (const tx of transactions.data) {
      statusBreakdown[tx.status] = (statusBreakdown[tx.status] || 0) + Math.abs(tx.amount);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes Financieros</h1>
          <p className="text-gray-500 dark:text-gray-400">Análisis financiero consolidado de la plataforma</p>
        </div>
        <Button onClick={handleExportCSV} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar CSV
        </Button>
      </div>

      {/* Filters Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Fecha Inicio</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Fecha Fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleApplyFilters} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Filter className="w-4 h-4 mr-2" />}
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(balanceGeneral.totalIncome || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Egresos</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(balanceGeneral.totalExpenses || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance Neto</p>
                  <p className={`text-lg font-bold ${(balanceGeneral.netBalance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(balanceGeneral.netBalance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comisiones</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(balanceGeneral.totalCommissions || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Cards: Orders & Withdrawals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Resumen de Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Órdenes</p>
                <p className="text-xl font-bold">{orderSummary.totalOrders || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Ventas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(orderSummary.totalSales || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Comisiones</p>
                <p className="text-lg font-semibold text-orange-600">{formatCurrency(orderSummary.totalCommissions || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ganancias Vendedores</p>
                <p className="text-lg font-semibold">{formatCurrency(orderSummary.totalSellerEarnings || 0)}</p>
              </div>
            </div>
            {orderSummary.byStatus && Object.keys(orderSummary.byStatus).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(orderSummary.byStatus).map(([status, count]: any) => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {ORDER_STATUS_LABELS[status] || status}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Resumen de Retiros
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Solicitudes</p>
                <p className="text-xl font-bold">{withdrawalSummary.totalRequests || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monto Total</p>
                <p className="text-xl font-bold">{formatCurrency(withdrawalSummary.totalAmount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Aprobados</p>
                <p className="text-lg font-semibold text-green-600">
                  {withdrawalSummary.approved || 0} ({formatCurrency(withdrawalSummary.approvedAmount || 0)})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {withdrawalSummary.pending || 0} ({formatCurrency(withdrawalSummary.pendingAmount || 0)})
                </p>
              </div>
            </div>
            {(withdrawalSummary.rejected || 0) > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Rechazados: <span className="text-red-600 font-medium">{withdrawalSummary.rejected} ({formatCurrency(withdrawalSummary.rejectedAmount || 0)})</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Charts, Transactions, Balance Detail */}
      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5">
            <TableProperties className="w-4 h-4" />
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            Balance Detallado
          </TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <div className="space-y-6">
            {/* Daily Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4" />
                  Tendencia Diaria - Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" name="Ingresos" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Egresos" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-12">Sin datos para el período seleccionado</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Transacciones por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                        <Tooltip formatter={(value: number, name: string) =>
                          name === 'monto' ? formatCurrency(value) : value
                        } />
                        <Legend />
                        <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-12">Sin datos</p>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4" />
                    Distribución por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-12">Sin datos</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
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
                      <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data?.length > 0 ? (
                      transactions.data.map((tx: any) => {
                        const isPositive = tx.amount >= 0;
                        return (
                          <tr key={tx.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {formatShortDate(tx.createdAt)}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="text-xs">
                                {TYPE_LABELS[tx.type] || tx.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-700 dark:text-gray-200">
                              {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '-'}
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                              {tx.description}
                            </td>
                            <td className={`p-3 text-right font-medium whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={tx.status === 'completed' ? 'default' : 'secondary'}
                                className={`text-xs ${
                                  tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {STATUS_LABELS[tx.status] || tx.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                              {tx.relatedOrderId ? `Orden` : tx.relatedCreditId ? `Crédito` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">
                          No se encontraron transacciones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactions.pagination && transactions.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, transactions.pagination.total)} de {transactions.pagination.total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => fetchReport(currentPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, transactions.pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      const tp = transactions.pagination.totalPages;
                      if (tp <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= tp - 2) {
                        pageNum = tp - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => fetchReport(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= transactions.pagination.totalPages}
                      onClick={() => fetchReport(currentPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Detail Tab */}
        <TabsContent value="balance">
          <div className="space-y-6">
            {/* Balance General Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Balance General</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Concepto</th>
                      <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 text-gray-700 dark:text-gray-200">Total Ingresos</td>
                      <td className="p-3 text-right font-medium text-green-600">{formatCurrency(balanceGeneral.totalIncome || 0)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-gray-700 dark:text-gray-200">Total Egresos</td>
                      <td className="p-3 text-right font-medium text-red-600">{formatCurrency(balanceGeneral.totalExpenses || 0)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-gray-700 dark:text-gray-200">Total Comisiones</td>
                      <td className="p-3 text-right font-medium text-orange-600">{formatCurrency(balanceGeneral.totalCommissions || 0)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-gray-700 dark:text-gray-200">Montos Pendientes</td>
                      <td className="p-3 text-right font-medium text-yellow-600">{formatCurrency(balanceGeneral.pendingAmounts || 0)}</td>
                    </tr>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">Balance Neto</td>
                      <td className={`p-3 text-right font-bold text-lg ${(balanceGeneral.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balanceGeneral.netBalance || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Breakdown by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Desglose por Tipo de Transacción</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                      <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Cantidad</th>
                      <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(typeBreakdown).length > 0 ? (
                      Object.entries(typeBreakdown).map(([key, val]: any) => (
                        <tr key={key} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="p-3">
                            <Badge variant="secondary" className="text-xs">{TYPE_LABELS[key] || key}</Badge>
                          </td>
                          <td className="p-3 text-right text-gray-700 dark:text-gray-200">{val.count}</td>
                          <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(val.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-400">Sin datos</td>
                      </tr>
                    )}
                    {Object.entries(typeBreakdown).length > 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="p-3 font-bold">Total</td>
                        <td className="p-3 text-right font-bold">
                          {Object.values(typeBreakdown).reduce((sum: number, val: any) => sum + val.count, 0)}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(Object.values(typeBreakdown).reduce((sum: number, val: any) => sum + val.total, 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Breakdown by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Desglose por Estado</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                      <th className="text-right p-3 font-medium text-gray-600 dark:text-gray-300">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(statusBreakdown).length > 0 ? (
                      Object.entries(statusBreakdown).map(([status, total]) => (
                        <tr key={status} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="p-3">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {STATUS_LABELS[status] || status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-gray-400">Sin datos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
