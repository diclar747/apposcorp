import { ShoppingCart, DollarSign, Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSellerStats } from '@/hooks/useSellerStats';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSellerStats();

  const features = user?.sellerProfile?.plan?.features || [];
  const hasFeature = (name: string) => features.some(f => f.toLowerCase().includes(name.toLowerCase()));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Error al cargar el dashboard</h2>
          <p className="text-slate-500">No pudimos obtener tus estadísticas en este momento.</p>
        </div>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  // Dashboard Skeleton Helper
  const DashboardSkeleton = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  if (isLoading) return <DashboardSkeleton />;

  const { stats, recentOrders, chartData } = data || { 
    stats: { totalRevenue: 0, totalSales: 0, pendingOrders: 0, currentBalance: 0, storeName: '' }, 
    recentOrders: [], 
    chartData: [] 
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel de {stats.storeName || 'Vendedor'}
          </h1>
          <p className="text-slate-500 font-medium">Monitorea el rendimiento de tu negocio en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="px-3 py-1 font-bold border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400">
             Vendedor Verificado
           </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4",
        hasFeature('Pedidos') ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-4"
      )}>
        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Billetera</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {formatCurrency(stats.currentBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Compras</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {formatCurrency(stats.totalPurchases || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Totales</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalSales}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasFeature('Pedidos') && (
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart */}
      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 border-b dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black dark:text-white">Rendimiento de Ventas</CardTitle>
            <p className="text-sm text-slate-500 font-medium">Ingresos reales de los últimos 30 días</p>
          </div>
          <Badge variant="outline" className="font-bold">Diario</Badge>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: "#94A3B8", fontSize: 10}} 
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: "#94A3B8"}} 
                  tickFormatter={(val) => `₲${val / 1000}k`} 
                />
                <Tooltip
                  cursor={{fill: 'rgba(226, 232, 240, 0.4)'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(val: number) => [formatCurrency(val), "Ingreso"]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-PY', { dateStyle: 'long' })}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? "#10B981" : "#E2E8F0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      {hasFeature('Pedidos') && (
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black dark:text-white">Pedidos Recientes</CardTitle>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/vendedor/pedidos')}
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              Ver Historial Completo
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Orden</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Comprador</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-500 font-medium">
                        Aún no has recibido pedidos. ¡Sigue promocionando tus productos!
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{order.orderNumber}</td>
                        <td className="px-8 py-5 text-slate-600 dark:text-slate-400 font-medium">{order.buyer}</td>
                        <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{formatCurrency(order.total)}</td>
                        <td className="px-8 py-5">
                          <Badge 
                            className={cn(
                              "font-bold px-3 py-1 rounded-full border-none",
                              order.status === 'delivered' ? "bg-emerald-100 text-emerald-700" : 
                              order.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

