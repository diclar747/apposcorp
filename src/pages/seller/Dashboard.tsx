import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { ordersApi, productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, productsData] = await Promise.all([
          ordersApi.getAll('seller'),
          user?.sellerProfile?.id
            ? productsApi.getAll({ sellerId: user.sellerProfile.id })
            : Promise.resolve([]),
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalEarnings = orders.reduce((sum: number, o: any) => sum + (o.sellerEarnings || 0), 0);

  // Build weekly sales data from real orders
  const buildWeeklyData = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const weekData = days.map(name => ({ name, ventas: 0 }));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= weekAgo) {
        const dayIndex = orderDate.getDay();
        weekData[dayIndex].ventas += order.total || 0;
      }
    });

    // Reorder starting from Monday
    return [...weekData.slice(1), weekData[0]];
  };

  const salesData = buildWeeklyData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Bienvenido de vuelta, {user?.firstName}</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Ganancias</p>
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
                <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Productos</p>
                <p className="text-xl font-bold dark:text-white">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Ventas de la Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
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

      {/* Recent Orders */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="dark:text-white">Pedidos Recientes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendedor/pedidos')} className="dark:text-gray-300 dark:hover:bg-slate-800">Ver todos</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay pedidos aún</p>
            )}
            {orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium dark:text-white">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.items?.length || 0} productos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold dark:text-white">{formatCurrency(order.total)}</p>
                  <Badge
                    variant={
                      order.status === 'delivered' ? 'default' :
                        order.status === 'pending' ? 'secondary' : 'outline'
                    }
                    className={
                      order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-none' :
                          'dark:border-slate-700 dark:text-gray-400'
                    }
                  >
                    {order.status === 'delivered' ? 'Entregado' :
                      order.status === 'pending' ? 'Pendiente' :
                        order.status === 'confirmed' ? 'Confirmado' :
                          order.status === 'preparing' ? 'Preparando' :
                            order.status === 'ready' ? 'Listo' :
                              order.status === 'in_transit' ? 'En camino' : order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
