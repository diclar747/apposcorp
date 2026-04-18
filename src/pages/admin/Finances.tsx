import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Loader2, Download, Table as TableIcon, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatCurrency, formatDate, getTransactionStatusInfo, getTransactionTypeInfo, formatCompactNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminFinances() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['financial-report'],
    queryFn: () => reportsApi.getFinancial(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleExport = () => {
    try {
      if (!report || !report.transactions.length) {
        toast.error('No hay datos suficientes para exportar');
        return;
      }
      
      const txData = report.transactions.map((t: any) => ({
        'Fecha': formatDate(t.createdAt),
        'Tipo': t.type,
        'Usuario': `${t.user?.firstName || ''} ${t.user?.lastName || ''}`,
        'Descripción': t.description,
        'Monto': t.amount,
        'Estado': t.status
      }));

      const wsTransactions = XLSX.utils.json_to_sheet(txData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsTransactions, "Transacciones");
      
      if (report.dailyTrend && report.dailyTrend.length) {
        const trendData = report.dailyTrend.map((d: any) => ({
          'Fecha': d.date,
          'Ingresos': d.income,
          'Egresos': d.expenses
        }));
        const wsTrend = XLSX.utils.json_to_sheet(trendData);
        XLSX.utils.book_append_sheet(wb, wsTrend, "Tendencia Diaria");
      }

      XLSX.writeFile(wb, `finanzas-oscorp-${new Date().getTime()}.xlsx`);
      toast.success('Reporte exportado correctamente a Excel');
    } catch (error) {
      toast.error('Error al exportar reporte');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Generando reporte consolidado...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="p-4 bg-red-100 rounded-full text-red-600 mb-2">
          <DollarSign className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold">Error al cargar finanzas</h2>
        <p className="text-gray-500 max-w-md">No pudimos obtener la información financiera global. Por favor intenta de nuevo.</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const { balanceGeneral, orderSummary, dailyTrend, transactions, withdrawalSummary } = report;

  const stats = [
    { 
      title: 'Ingresos Totales', 
      value: balanceGeneral.totalIncome, 
      label: 'Depósitos y Ventas',
      icon: TrendingUp, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Egresos Totales', 
      value: balanceGeneral.totalExpenses, 
      label: 'Retiros y Gastos',
      icon: TrendingDown, 
      color: 'bg-red-500' 
    },
    { 
      title: 'Comisiones Generadas', 
      value: orderSummary.totalCommissions, 
      label: 'Ganancia de Plataforma',
      icon: Wallet, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Volumen de Ventas', 
      value: orderSummary.totalSales, 
      label: `${orderSummary.totalOrders} pedidos realizados`,
      icon: DollarSign, 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
          <p className="text-gray-500 dark:text-gray-400">Auditoría financiera y control de transacciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => refetch()} variant="secondary">Actualizar</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stat.value)}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border dark:border-slate-800">
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" /> Resumen Gráfico</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2"><TableIcon className="w-4 h-4" /> Transacciones</TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2"><ArrowDownRight className="w-4 h-4" /> Retiros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análisis de Flujo Diario (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `₲${value / 1000000}M`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="income" name="Ingresos" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expenses" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por Tipo de Transacción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(report.typeBreakdown).map(([name, data]: any) => ({ 
                      name: getTransactionTypeInfo(name).label, 
                      total: data.total 
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `₲${formatCompactNumber(value)}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="total" name="Monto Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{tx.user?.firstName} {tx.user?.lastName}</p>
                        <p className="text-[10px] text-gray-500">{tx.user?.email}</p>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{tx.type}</Badge>
                      </TableCell>
                      <TableCell className={`font-bold ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTransactionStatusInfo(tx.status).bgColor} ${getTransactionStatusInfo(tx.status).color} border-0`}>
                          {getTransactionStatusInfo(tx.status).label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-yellow-50 border-yellow-100"><CardContent className="p-4">
              <p className="text-xs font-bold text-yellow-800 uppercase">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900">{withdrawalSummary.pending}</p>
              <p className="text-sm text-yellow-700">{formatCurrency(withdrawalSummary.pendingAmount)}</p>
            </CardContent></Card>
            <Card className="bg-green-50 border-green-100"><CardContent className="p-4">
              <p className="text-xs font-bold text-green-800 uppercase">Retiros Aprobados</p>
              <p className="text-2xl font-bold text-green-900">{withdrawalSummary.approved}</p>
              <p className="text-sm text-green-700">{formatCurrency(withdrawalSummary.approvedAmount)}</p>
            </CardContent></Card>
            <Card className="bg-red-50 border-red-100"><CardContent className="p-4">
              <p className="text-xs font-bold text-red-800 uppercase">Retiros Rechazados</p>
              <p className="text-2xl font-bold text-red-900">{withdrawalSummary.rejected}</p>
              <p className="text-sm text-red-700">{formatCurrency(withdrawalSummary.rejectedAmount)}</p>
            </CardContent></Card>
            <Card className="bg-blue-50 border-blue-100"><CardContent className="p-4">
              <p className="text-xs font-bold text-blue-800 uppercase">Monto Total Pagado</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(withdrawalSummary.approvedAmount)}</p>
              <p className="text-sm text-blue-700">Total histórico</p>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
