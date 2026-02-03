import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { mockTransactions, mockCredits, mockWallets } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const monthlyData = [
  { month: 'Ene', income: 45000000, expenses: 32000000 },
  { month: 'Feb', income: 52000000, expenses: 38000000 },
  { month: 'Mar', income: 48000000, expenses: 35000000 },
  { month: 'Abr', income: 61000000, expenses: 42000000 },
  { month: 'May', income: 55000000, expenses: 40000000 },
  { month: 'Jun', income: 67000000, expenses: 45000000 },
];

const stats = [
  { title: 'Ingresos Totales', value: 328000000, change: 15, trend: 'up', icon: TrendingUp, color: 'bg-green-500' },
  { title: 'Egresos Totales', value: 232000000, change: 8, trend: 'up', icon: TrendingDown, color: 'bg-red-500' },
  { title: 'Balance General', value: 96000000, change: 23, trend: 'up', icon: DollarSign, color: 'bg-blue-500' },
  { title: 'Comisiones', value: 16400000, change: 12, trend: 'up', icon: Wallet, color: 'bg-purple-500' },
];

export default function AdminFinances() {
  const totalWalletBalance = mockWallets.reduce((sum, w) => sum + w.balance, 0);
  const activeCredits = mockCredits.filter(c => c.status === 'active').length;
  const totalCreditAmount = mockCredits.filter(c => c.status === 'active').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-500">Resumen financiero del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar Excel</Button>
          <Button variant="outline">Exportar PDF</Button>
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
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stat.value)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>+{stat.change}%</span>
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

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Saldo Total en Wallets</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalWalletBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Créditos Activos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{activeCredits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Monto en Créditos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCreditAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₲${value / 1000000}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `₲${value / 1000000}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="income" name="Ingresos" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" name="Egresos" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
