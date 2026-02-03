import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockOrders } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const weeklyData = [
  { day: 'Lun', ventas: 850000 },
  { day: 'Mar', ventas: 1200000 },
  { day: 'Mie', ventas: 950000 },
  { day: 'Jue', ventas: 1400000 },
  { day: 'Vie', ventas: 1800000 },
  { day: 'Sab', ventas: 2200000 },
  { day: 'Dom', ventas: 1600000 },
];

const monthlyData = [
  { month: 'Ene', ventas: 4500000 },
  { month: 'Feb', ventas: 5200000 },
  { month: 'Mar', ventas: 4800000 },
  { month: 'Abr', ventas: 6100000 },
  { month: 'May', ventas: 5500000 },
  { month: 'Jun', ventas: 6700000 },
];

export default function SellerSales() {
  const { user } = useAuthStore();
  const sellerOrders = mockOrders.filter(o => o.sellerId === user?.id);
  
  const totalSales = sellerOrders.reduce((sum, o) => sum + o.total, 0);
  const totalEarnings = sellerOrders.reduce((sum, o) => sum + o.sellerEarnings, 0);
  const totalCommission = sellerOrders.reduce((sum, o) => sum + o.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500">Análisis de tus ventas y ganancias</p>
        </div>
        <Button variant="outline">Exportar reporte</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventas Totales</p>
                <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tus Ganancias</p>
                <p className="text-xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-xl font-bold">{sellerOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Comisiones</p>
                <p className="text-xl font-bold">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₲${value / 1000000}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₲${value / 1000000}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sellerOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.items.length} productos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{formatCurrency(order.sellerEarnings)}</p>
                  <p className="text-xs text-gray-500">Comisión: {formatCurrency(order.commissionAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
