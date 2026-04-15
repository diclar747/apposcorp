import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function SellerSales() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.sellerProfile && user.sellerProfile.plan) {
      const features = user.sellerProfile.plan.features || [];
      if (!features.some(f => f.toLowerCase().includes('ventas'))) {
        toast.error('Tu plan no incluye historial de ventas');
        navigate('/vendedor');
      }
    }
  }, [user, navigate]);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await ordersApi.getAll('seller');
        setOrders(data);
      } catch (error) {
        console.error('Error cargando ventas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalEarnings = orders.reduce((sum: number, o: any) => sum + (o.sellerEarnings || 0), 0);
  const totalCommission = orders.reduce((sum: number, o: any) => sum + (o.commissionAmount || 0), 0);

  // Build weekly data from real orders
  const buildWeeklyData = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const weekData = days.map(day => ({ day, ventas: 0 }));
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= weekAgo) {
        const dayIndex = orderDate.getDay();
        weekData[dayIndex].ventas += order.total || 0;
      }
    });
    return [...weekData.slice(1), weekData[0]];
  };

  // Build monthly data from real orders
  const buildMonthlyData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const monthData = months.map(month => ({ month, ventas: 0 }));

    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getFullYear() === currentYear) {
        monthData[orderDate.getMonth()].ventas += order.total || 0;
      }
    });

    // Only show up to current month
    const currentMonth = new Date().getMonth();
    return monthData.slice(0, currentMonth + 1);
  };

  const weeklyData = buildWeeklyData();
  const monthlyData = buildMonthlyData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventas</h1>
          <p className="text-gray-500 dark:text-gray-400">Análisis de tus ventas y ganancias</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Totales</p>
                <p className="text-xl font-bold dark:text-white">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tus Ganancias</p>
                <p className="text-xl font-bold dark:text-white">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pedidos</p>
                <p className="text-xl font-bold dark:text-white">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Comisiones</p>
                <p className="text-xl font-bold dark:text-white">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Ventas de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `₲${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
                  />
                  <Bar dataKey="ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `₲${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay ventas registradas aún</p>
            )}
            {orders.slice(0, 10).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium dark:text-white">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.items?.length || 0} productos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 dark:text-green-400">+{formatCurrency(order.sellerEarnings || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comisión: {formatCurrency(order.commissionAmount || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
