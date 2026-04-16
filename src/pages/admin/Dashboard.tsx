import { motion } from 'framer-motion';
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCcw,
  Package,
  FileText,
  Download,
  Activity,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const exportToPDF = () => {
    if (!stats) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Logo/Header
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('OSCORP PLATFORM', 15, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('REPORTE EJECUTIVO MAESTRO', 15, 33);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PY')}`, pageWidth - 50, 25);

      // Main KPIs Section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.text('Resumen de Rendimiento', 15, 55);

      const kpiData = [
        ['Usuarios Totales', stats.metrics.users.current.toString()],
        ['Tiendas Activas', stats.metrics.sellers.current.toString()],
        ['Ventas Hoy', formatCurrency(stats.finances.salesToday)],
        ['Ingresos 30 Días', formatCurrency(stats.finances.income30Days)],
        ['Productos Activos', stats.metrics.products.current.toString()],
        ['Créditos Vigentes', stats.metrics.credits.current.toString()],
      ];

      autoTable(doc, {
        startY: 60,
        head: [['Métrica', 'Valor']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Recent Orders Table
      doc.text('Últimas Órdenes del Sistema', 15, (doc as any).lastAutoTable.finalY + 15);

      const orderData = stats.recentActivity.orders.map(o => [
        o.orderNumber,
        o.buyer,
        o.store,
        formatCurrency(o.total),
        o.status.toUpperCase(),
        new Date(o.date).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Pedido', 'Cliente', 'Tienda', 'Total', 'Estado', 'Fecha']],
        body: orderData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
      });

      doc.save(`oscorp-reporte-master-${new Date().getTime()}.pdf`);
      toast.success('Reporte PDF generado con éxito');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Error al generar el PDF');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Error de conexión</h2>
          <p className="text-muted-foreground">No pudimos cargar las métricas globales.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" /> Reintentar
        </Button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Usuarios Totales',
      value: stats?.metrics.users.current || 0,
      previous: stats?.metrics.users.previous || 0,
      icon: Users,
      color: 'bg-blue-600',
      description: 'Crecimiento acumulado'
    },
    {
      title: 'Tiendas Activas',
      value: stats?.metrics.sellers.current || 0,
      previous: stats?.metrics.sellers.previous || 0,
      icon: Store,
      color: 'bg-emerald-600',
      description: 'Comercios verificados'
    },
    {
      title: 'Productos Activos',
      value: stats?.metrics.products.current || 0,
      previous: stats?.metrics.products.previous || 0,
      icon: Package,
      color: 'bg-purple-600',
      description: 'Stock global'
    },
    {
      title: 'Ventas Hoy',
      value: formatCurrency(stats?.finances.salesToday || 0),
      isCurrency: true,
      icon: DollarSign,
      color: 'bg-amber-600',
      description: 'Volumen 24hs'
    },
    {
      title: 'Ingresos Mes',
      value: formatCurrency(stats?.finances.income30Days || 0),
      isCurrency: true,
      icon: TrendingUp,
      color: 'bg-rose-600',
      description: 'Últimos 30 días'
    },
    {
      title: 'Créditos Activos',
      value: stats?.metrics.credits.current || 0,
      previous: stats?.metrics.credits.previous || 0,
      icon: GraduationCap,
      color: 'bg-indigo-600',
      description: 'Cartera vigente'
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Centro de Control Administrativo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Inteligencia de negocio y monitoreo real-time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Actualizar
          </Button>
          <Button size="sm" onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : (
          kpis.map((kpi, index) => {
            const growth = kpi.isCurrency ? null : calculateGrowth(kpi.value as number, kpi.previous || 0);
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="dark:bg-slate-900 dark:border-slate-800 h-full relative overflow-hidden group">
                   <div className={cn("absolute top-0 right-0 w-16 h-16 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110", kpi.color)} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg flex items-center justify-center text-white", kpi.color)}>
                        <kpi.icon className="w-4 h-4" />
                      </div>
                      {growth !== null && (
                        <div className={cn(
                          "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          growth >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {Math.abs(Math.round(growth))}%
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{kpi.title}</p>
                      <p className={cn(
                        "font-black mt-1 dark:text-white truncate",
                        kpi.isCurrency ? "text-lg" : "text-2xl"
                      )}>{kpi.value}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{kpi.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Commissions Bar Chart */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                Ventas y Comisiones (6 Meses)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-2">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.salesSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `₲${val / 1000000}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                      formatter={(val: number) => [formatCurrency(val), '']}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comisiones" name="Comisión" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Area Chart */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Crecimiento de Usuarios
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-2">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.userSeries}>
                    <defs>
                      <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="clientes" name="Clientes" stroke="#8b5cf6" fill="url(#colorClients)" strokeWidth={2} />
                    <Area type="monotone" dataKey="vendedores" name="Vendedores" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Pie Chart */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 lg:col-span-1">
          <CardHeader>
             <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                Estado de Pedidos
              </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-64 w-full">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.orderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {stats?.orderDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
             </div>
          </CardContent>
        </Card>

        {/* Recent Orders Table */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
               <Package className="w-4 h-4 text-blue-500" />
               Órdenes Recientes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Ver Todas</Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
               <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
               </div>
            ) : !stats?.recentActivity.orders.length ? (
              <div className="py-20 text-center">
                 <p className="text-xs text-muted-foreground">No hay registro de órdenes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Cliente / Tienda</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Total</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold font-mono text-blue-500">{order.orderNumber}</span>
                          <p className="text-[8px] text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-3 px-4">
                           <p className="text-xs font-bold">{order.buyer}</p>
                           <p className="text-[9px] text-muted-foreground uppercase">{order.store}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs font-black">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                           <Badge variant="outline" className="text-[8px] font-black h-5 border-blue-500/20 text-blue-500 bg-blue-500/5 uppercase">{order.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Transactions Section */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Últimas 10 Transacciones Globales
           </CardTitle>
           <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Auditoría Completa</Button>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading ? (
             <div className="p-4 space-y-4">
                <Skeleton className="h-40 w-full" />
             </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                      <tr>
                         <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Tipo</th>
                         <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Usuario</th>
                         <th className="text-left py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Email</th>
                         <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Monto</th>
                         <th className="text-right py-3 px-4 text-[10px] font-bold uppercase text-muted-foreground">Estado</th>
                      </tr>
                   </thead>
                   <tbody>
                      {stats?.recentActivity.transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                           <td className="py-3 px-4 text-[10px] font-bold uppercase text-blue-500">{tx.type}</td>
                           <td className="py-3 px-4 text-xs font-medium">{tx.user}</td>
                           <td className="py-3 px-4 text-xs text-muted-foreground">{tx.email}</td>
                           <td className={cn(
                             "py-3 px-4 text-right text-xs font-bold",
                             tx.amount >= 0 ? "text-emerald-500" : "text-rose-500"
                           )}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                           </td>
                           <td className="py-3 px-4 text-right">
                              <Badge variant="outline" className={cn(
                                "text-[9px] h-5",
                                tx.status === 'completed' ? "border-emerald-500/20 text-emerald-500" : "border-rose-500/20 text-rose-500"
                              )}>{tx.status}</Badge>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
