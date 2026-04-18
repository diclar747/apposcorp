import { ShoppingCart, DollarSign, Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { formatCurrency, getOrderStatusInfo, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useSellerStats } from '@/hooks/useSellerStats';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="space-y-4 sm:space-y-6 pb-10 px-0 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-0">
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
        "grid gap-6 px-4 sm:px-0",
        hasFeature('Pedidos') 
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" 
          : "grid-cols-2 lg:grid-cols-4"
      )}>
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billetera</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(stats.currentBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20 group-hover:bg-red-500 transition-colors" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compras</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalPurchases || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/20 group-hover:bg-purple-500 transition-colors" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ventas Totales</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalSales}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasFeature('Pedidos') && (
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pendientes</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart */}
      <div className="px-4 sm:px-0">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-xl sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="p-5 sm:p-8 border-b dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black dark:text-white">Rendimiento de Ventas</CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Ingresos reales de los últimos 30 días</p>
            </div>
            <Badge variant="outline" className="font-bold">Diario</Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: "currentColor", fontSize: 10, fontWeight: 600}} 
                    className="text-slate-400 dark:text-slate-500"
                    tickFormatter={(str) => {
                      const [y, m, d] = str.split('-').map(Number);
                      const date = new Date(y, m - 1, d);
                      return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });
                    }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: "currentColor", fontSize: 10, fontWeight: 600}} 
                    className="text-slate-400 dark:text-slate-500"
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000)}k`;
                      return val;
                    }}
                    width={45}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              {(() => {
                                const [y, m, d] = (label as string).split('-').map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString('es-PY', { dateStyle: 'long' });
                              })()}
                            </p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      {hasFeature('Pedidos') && (
        <div className="px-4 sm:px-0">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-xl sm:rounded-[2rem] overflow-hidden">
            <CardHeader className="p-5 sm:p-8 border-b dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl font-black dark:text-white">Pedidos Recientes</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
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
                            variant="secondary"
                            className={cn(
                              "font-bold px-3 py-1 rounded-full border-none",
                              getOrderStatusInfo(order.status).bgColor,
                              getOrderStatusInfo(order.status).color,
                              "dark:bg-opacity-20"
                            )}
                          >
                            {getOrderStatusInfo(order.status).label}
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
        </div>
      )}
    </div>
  );
}

