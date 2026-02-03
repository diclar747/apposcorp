import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon, 
  Target, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Home,
  Car,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockFinancialRecords, mockFinancialCategories } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 5S Methodology Cards
const ssCards = [
  { title: 'Seiri', subtitle: 'Clasificación', description: 'Organiza tus gastos por categorías', color: 'bg-red-500', icon: Target },
  { title: 'Seiton', subtitle: 'Orden', description: 'Estructura tu presupuesto mensual', color: 'bg-blue-500', icon: PieChartIcon },
  { title: 'Seiso', subtitle: 'Limpieza', description: 'Elimina gastos innecesarios', color: 'bg-green-500', icon: TrendingDown },
  { title: 'Seiketsu', subtitle: 'Estandarización', description: 'Crea hábitos financieros', color: 'bg-yellow-500', icon: Wallet },
  { title: 'Shitsuke', subtitle: 'Disciplina', description: 'Mantén el control constante', color: 'bg-purple-500', icon: Target },
];

export default function ClientIngenio() {
  const { user } = useAuthStore();
  
  // Calculate totals from financial records
  const income = mockFinancialRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const expenses = mockFinancialRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const assets = mockFinancialRecords
    .filter(r => r.type === 'asset')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const liabilities = mockFinancialRecords
    .filter(r => r.type === 'liability')
    .reduce((sum, r) => sum + r.amount, 0);

  const monthlyData = [
    { month: 'Ene', income: 6500000, expenses: 4500000 },
    { month: 'Feb', income: 7200000, expenses: 4800000 },
    { month: 'Mar', income: 6800000, expenses: 5200000 },
  ];

  const expenseCategories = [
    { name: 'Alimentación', value: 1200000, color: '#ef4444' },
    { name: 'Transporte', value: 800000, color: '#f97316' },
    { name: 'Servicios', value: 1500000, color: '#3b82f6' },
    { name: 'Entretenimiento', value: 500000, color: '#8b5cf6' },
  ];

  if (!user?.ingenioAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Target className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Ingenio Millonario</h2>
        <p className="text-gray-500 text-center mt-2">
          Este módulo requiere activación por parte del administrador
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Ingenio Millonario</h1>
        </div>
        <p className="text-sm text-gray-500">Controla tus finanzas como un profesional</p>
      </div>

      {/* Balance Cards */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm text-white/80">Ingresos</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(income)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm text-white/80">Egresos</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(expenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth */}
      <div className="px-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Patrimonio Neto</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(assets - liabilities)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+12.5%</span>
                </div>
                <p className="text-xs text-gray-500">vs mes anterior</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Activos</p>
                  <p className="font-bold">{formatCurrency(assets)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Pasivos</p>
                  <p className="font-bold">{formatCurrency(liabilities)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5S Cards */}
      <div className="px-4">
        <h2 className="font-semibold text-gray-900 mb-3">Las 5S Financieras</h2>
        <div className="grid grid-cols-2 gap-3">
          {ssCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-gray-900">{card.title}</p>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="px-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `₲${v/1000000}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribución de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {expenseCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-gray-600">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo ingreso
          </Button>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo gasto
          </Button>
        </div>
      </div>
    </div>
  );
}
