import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  mockUsers,
  mockStores,
  mockProducts,
  mockOrders,
  mockTransactions,
  mockCredits
} from '@/data/mockData';
import { formatCurrency, formatNumber } from '@/lib/utils';
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const stats = [
  {
    title: 'Usuarios Totales',
    value: mockUsers.length,
    change: 12,
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    title: 'Tiendas Activas',
    value: mockStores.filter(s => s.isActive).length,
    change: 8,
    trend: 'up',
    icon: Store,
    color: 'bg-green-500',
  },
  {
    title: 'Productos',
    value: mockProducts.length,
    change: 15,
    trend: 'up',
    icon: Package,
    color: 'bg-purple-500',
  },
  {
    title: 'Ventas Hoy',
    value: formatCurrency(12500000),
    change: 23,
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-orange-500',
  },
  {
    title: 'Ingresos del Mes',
    value: formatCurrency(158000000),
    change: -5,
    trend: 'down',
    icon: DollarSign,
    color: 'bg-pink-500',
  },
  {
    title: 'Créditos Activos',
    value: mockCredits.filter(c => c.status === 'active').length,
    change: 3,
    trend: 'up',
    icon: TrendingUp,
    color: 'bg-cyan-500',
  },
];

const salesData = [
  { name: 'Ene', ventas: 45000000, comisiones: 2250000 },
  { name: 'Feb', ventas: 52000000, comisiones: 2600000 },
  { name: 'Mar', ventas: 48000000, comisiones: 2400000 },
  { name: 'Abr', ventas: 61000000, comisiones: 3050000 },
  { name: 'May', ventas: 55000000, comisiones: 2750000 },
  { name: 'Jun', ventas: 67000000, comisiones: 3350000 },
];

const userGrowthData = [
  { name: 'Ene', clientes: 120, vendedores: 15 },
  { name: 'Feb', clientes: 150, vendedores: 18 },
  { name: 'Mar', clientes: 180, vendedores: 22 },
  { name: 'Abr', clientes: 220, vendedores: 28 },
  { name: 'May', clientes: 280, vendedores: 35 },
  { name: 'Jun', clientes: 350, vendedores: 42 },
];

const orderStatusData = [
  { name: 'Pendientes', value: 12, color: '#fbbf24' },
  { name: 'En preparación', value: 8, color: '#a78bfa' },
  { name: 'En camino', value: 15, color: '#60a5fa' },
  { name: 'Entregados', value: 156, color: '#4ade80' },
  { name: 'Cancelados', value: 5, color: '#f87171' },
];

const recentOrders = mockOrders.slice(0, 5);
const recentTransactions = mockTransactions.slice(0, 5);

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Resumen general del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="dark:text-gray-300 dark:hover:bg-slate-800 dark:border-slate-700">Exportar reporte</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Ver detalles</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </span>
                      <span className="text-xs text-gray-400">vs mes anterior</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Ventas y Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `₲${value / 1000000}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
                  />
                  <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comisiones" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Crecimiento de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="clientes" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="vendedores" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Estado de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="dark:text-white">Pedidos Recientes</CardTitle>
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-slate-800">Ver todos</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pedido</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tienda</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{order.orderNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {mockUsers.find(u => u.id === order.buyerId)?.firstName} {mockUsers.find(u => u.id === order.buyerId)?.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {mockStores.find(s => s.id === order.storeId)?.name}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              order.status === 'in_transit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                          {order.status === 'delivered' ? 'Entregado' :
                            order.status === 'pending' ? 'Pendiente' :
                              order.status === 'in_transit' ? 'En camino' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transacciones Recientes</CardTitle>
          <Button variant="ghost" size="sm">Ver todas</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-500">{transaction.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{transaction.type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.description}</td>
                    <td className={`py-3 px-4 text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString('es-PY')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {transaction.status === 'completed' ? 'Completado' :
                          transaction.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
