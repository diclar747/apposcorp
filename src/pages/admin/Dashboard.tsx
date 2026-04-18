import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { formatCurrency, cn, getOrderStatusInfo, getTransactionStatusInfo, formatCompactNumber, generateReportPDF } from '@/lib/utils';
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, isError, refetch } = useAdminStats();

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const exportToPDF = () => {
    if (!stats) return;

    const statsHtml = `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">USUARIOS TOTALES</div>
          <div class="stat-value">${stats.metrics.users.current}</div>
        </div>
        <div class="stat">
          <div class="stat-label">TIENDAS ACTIVAS</div>
          <div class="stat-value">${stats.metrics.sellers.current}</div>
        </div>
        <div class="stat">
          <div class="stat-label">VENTAS HOY</div>
          <div class="stat-value text-green">${formatCurrency(stats.finances.salesToday)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">INGRESOS (30 DÍAS)</div>
          <div class="stat-value text-green">${formatCurrency(stats.finances.income30Days)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">PRODUCTOS ACTIVOS</div>
          <div class="stat-value">${stats.metrics.products.current}</div>
        </div>
        <div class="stat">
          <div class="stat-label">CRÉDITOS VIGENTES</div>
          <div class="stat-value">${stats.metrics.credits.current}</div>
        </div>
      </div>
    `;

    const orderRows = stats.recentActivity.orders.map(o => {
      const statusInfo = getOrderStatusInfo(o.status);
      let statusClass = 'badge-gray';
      if (o.status === 'delivered') statusClass = 'badge-green';
      if (o.status === 'pending') statusClass = 'badge-yellow';

      return `
        <tr>
          <td>${o.orderNumber}</td>
          <td>${o.buyer}</td>
          <td>${o.store}</td>
          <td class="font-bold">${formatCurrency(o.total)}</td>
          <td><span class="badge ${statusClass}">${statusInfo.label}</span></td>
          <td>${new Date(o.date).toLocaleDateString('es-PY')}</td>
        </tr>
      `;
    }).join('');

    const txRows = stats.recentActivity.transactions.map(tx => {
      const statusInfo = getTransactionStatusInfo(tx.status);
      return `
        <tr>
          <td>${tx.type.toUpperCase()}</td>
          <td>${tx.user}</td>
          <td>${tx.email}</td>
          <td class="${tx.amount >= 0 ? 'text-green' : 'text-red'} font-bold">${formatCurrency(tx.amount)}</td>
          <td><span class="badge badge-gray">${statusInfo.label}</span></td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <h3>Últimas Órdenes</h3>
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Tienda</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${orderRows}
        </tbody>
      </table>

      <h3 style="margin-top:24px">Últimas Transacciones</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${txRows}
        </tbody>
      </table>
    `;

    generateReportPDF('Reporte Maestro Ejecutivo', statsHtml, tableHtml);
    toast.success('Reporte maestro generado correctamente');
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
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
                whileHover={{ y: -4 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="dark:bg-slate-900/50 dark:border-slate-800 h-full relative overflow-hidden group hover:shadow-lg transition-all border-slate-200">
                   <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-5 -mr-8 -mt-8 transition-transform group-hover:scale-125 rounded-full blur-2xl", kpi.color)} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", kpi.color)}>
                        <kpi.icon className="w-5 h-5" />
                      </div>
                      {growth !== null && (
                        <div className={cn(
                          "flex items-center text-[11px] font-bold px-2 py-1 rounded-lg",
                          growth >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {Math.abs(Math.round(growth))}%
                        </div>
                      )}
                    </div>
                    <div className="mt-5">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                      <h2 className={cn(
                        "font-black mt-1 dark:text-white tracking-tight",
                        kpi.isCurrency ? "text-xl sm:text-2xl" : "text-3xl"
                      )}>
                        {kpi.value}
                      </h2>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                        <span className={cn("w-1 h-1 rounded-full", kpi.color)} />
                        {kpi.description}
                      </p>
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
                      tickFormatter={(val) => `₲${formatCompactNumber(val)}`}
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
                        data={stats?.orderDistribution.map(item => ({
                          ...item,
                          statusLabel: getOrderStatusInfo(item.status).label
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="statusLabel"
                      >
                        {stats?.orderDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle" 
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{value}</span>}
                      />
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/pedidos')}
              className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Ver Todas
            </Button>
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
                          <Badge className={`${getOrderStatusInfo(order.status).bgColor} ${getOrderStatusInfo(order.status).color} border-0 text-[8px] h-5 uppercase`}>
                            {getOrderStatusInfo(order.status).label}
                          </Badge>
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
                              <Badge className={`${getTransactionStatusInfo(tx.status).bgColor} ${getTransactionStatusInfo(tx.status).color} border-0 text-[9px] h-5`}>
                                {getTransactionStatusInfo(tx.status).label}
                              </Badge>
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
