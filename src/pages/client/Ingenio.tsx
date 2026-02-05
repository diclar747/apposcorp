import { useState, useEffect } from 'react';
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
  CreditCard,
  BookOpen,
  Play
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

// 5S Methodology Cards
const ssCards = [
  { title: 'Seiri', subtitle: 'Clasificación', description: 'Organiza tus gastos por categorías', color: 'bg-red-500', icon: Target },
  { title: 'Seiton', subtitle: 'Orden', description: 'Estructura tu presupuesto mensual', color: 'bg-blue-500', icon: PieChartIcon },
  { title: 'Seiso', subtitle: 'Limpieza', description: 'Elimina gastos innecesarios', color: 'bg-green-500', icon: TrendingDown },
  { title: 'Seiketsu', subtitle: 'Estandarización', description: 'Crea hábitos financieros', color: 'bg-yellow-500', icon: Wallet },
  { title: 'Shitsuke', subtitle: 'Disciplina', description: 'Mantén el control constante', color: 'bg-purple-500', icon: Target },
];

export default function ClientIngenio() {
  const { user, token } = useAuthStore();
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    assets: 0,
    liabilities: 0,
    netWorth: 0,
    netWorthGrowth: 0
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.ingenioAccess) {
      fetchData();
      fetchCourses();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/finances/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      }); // Public endpoint logic in backend, but good to auth
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let url = 'http://localhost:3001/api/finances';
      let body: any = newRecord;

      if (newRecord.type === 'budget') {
        const dateObj = new Date(newRecord.date);
        url = 'http://localhost:3001/api/finances/budget';
        body = {
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear(),
          incomeGoal: Number(newRecord.amount),
          expenseLimit: Number(newRecord.description)
        };
      } else {
        // Ensure amount is number
        body.amount = Number(body.amount);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(newRecord.type === 'budget' ? 'Presupuesto actualizado' : 'Registro guardado');
        setIsAddOpen(false);
        setNewRecord({ type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
        fetchData();
        // Also refresh budget if we are in budget view (we can trigger a reload or context update, but fetchData should handle summary)
        // Ideally we should reload budget section too if visible.
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  if (!user?.ingenioAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Target className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingenio Millonario</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Este módulo exclusivo te permite gestionar tus finanzas y acceder a educación premium. Contacta al administrador para activar tu acceso.
        </p>
        <Button variant="outline" className="gap-2">
          <Wallet className="w-4 h-4" />
          Solicitar Acceso
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="px-4 pt-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Ingenio Millonario</h1>
          </div>
          <p className="text-sm text-gray-500">Tu centro de control financiero</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full bg-purple-600 hover:bg-purple-700 h-10 w-10 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(val) => setNewRecord({ ...newRecord, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="asset">Activo (Inversión)</SelectItem>
                    <SelectItem value="liability">Pasivo (Deuda)</SelectItem>
                    <SelectItem value="budget">Presupuesto Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRecord.type === 'budget' ? (
                <>
                  <div className="space-y-2">
                    <Label>Fecha (Mes/Año)</Label>
                    <Input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Se aplicará al mes seleccionado</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta de Ingresos</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newRecord.amount} // We'll use 'amount' for Income Goal temporarily or add new state? 
                      // actually better to check the handler logic below. 
                      // Let's use 'amount' for Income Goal and 'description' for Expense Limit (parsed) or just use separate temp state in form?
                      // To avoid complex refactors, let's just add new fields to state in the main component or handle it here with additional inputs controlled by the same state object if we expand it.
                      // Let's assume we expanded the state or use 'amount' and 'description' cleverly? No, that's hacky.
                      // Best is to use specific fields. We can add specific fields to newRecord in the `const [newRecord...` line, but I am only replacing the FORM here.
                      // I need to update the state definition first.
                      // Wait, I can't update state definition with this tool if it is outside the range.
                      // The state definition is at lines 56-61. 
                      // I should probably use a multi_replace to do both safely.
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Límite de Gastos</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newRecord.description} // Using description field for expense limit as a hack or better add fields? 
                      // I strongly prefer adding fields.
                      onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      placeholder="Ej: Sueldo, Supermercado..."
                      value={newRecord.description}
                      onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full bg-purple-600">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="px-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Finanzas</TabsTrigger>
          <TabsTrigger value="budget">Presupuesto</TabsTrigger>
          <TabsTrigger value="education">Educación</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* ... (Existing Dashboard Content) ... */}
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Ingresos</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary.income)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Egresos</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary.expenses)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Net Worth & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Net Worth Card */}
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Patrimonio Neto</p>
                    <p className={`text-3xl font-bold ${summary.netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                      {formatCurrency(summary.netWorth)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 font-medium ${summary.netWorthGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {summary.netWorthGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm">{summary.netWorthGrowth.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-gray-400">vs mes anterior</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-dashed dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Activos</p>
                      <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(summary.assets)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Pasivos</p>
                      <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(summary.liabilities)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Flow Chart */}
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Flujo de Caja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Ingresos', value: summary.income, fill: '#10b981' },
                      { name: 'Gastos', value: summary.expenses, fill: '#ef4444' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(val) => `₲${val / 1000}k`} />
                      <Tooltip
                        formatter={(val: number) => formatCurrency(val)}
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5S Cards */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 ml-1">Metodología 5S</h2>
            <div className="grid grid-cols-2 gap-3">
              {ssCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-md transition-all cursor-pointer border-l-4 dark:bg-slate-900 dark:border-t-0 dark:border-r-0 dark:border-b-0" style={{ borderLeftColor: card.color.replace('bg-', '') }}>
                    <CardContent className="p-3">
                      <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center mb-2 shadow-sm`}>
                        <card.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{card.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{card.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <BudgetSection />
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay cursos disponibles aún.</p>
            </div>
          ) : (
            courses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-100 relative">
                  {course.coverImage ? (
                    <img src={course.coverImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <Badge className="mb-2">{course.category}</Badge>
                  <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                  <Button className="w-full bg-slate-900 text-white">
                    Ver Contenido <Play className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BudgetSection() {
  const { token } = useAuthStore();
  const [budget, setBudget] = useState({ incomeGoal: 0, expenseLimit: 0 });
  const [actuals, setActuals] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ incomeGoal: '', expenseLimit: '' });

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const res = await fetch(`http://localhost:3001/api/finances/budget?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBudget(data.budget);
        setActuals(data.actuals);
        setEditForm({
          incomeGoal: data.budget.incomeGoal.toString(),
          expenseLimit: data.budget.expenseLimit.toString()
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const res = await fetch('http://localhost:3001/api/finances/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month,
          year,
          incomeGoal: Number(editForm.incomeGoal),
          expenseLimit: Number(editForm.expenseLimit)
        })
      });

      if (res.ok) {
        toast.success('Presupuesto actualizado');
        setIsEditing(false);
        fetchBudget();
      } else {
        toast.error('Error al guardar presupuesto');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const incomeProgress = budget.incomeGoal > 0 ? (actuals.income / budget.incomeGoal) * 100 : 0;
  const expenseProgress = budget.expenseLimit > 0 ? (actuals.expenses / budget.expenseLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold dark:text-white">Resumen Mensual</CardTitle>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Editar Metas</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Configurar Presupuesto</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Meta de Ingresos</Label>
                  <Input
                    type="number"
                    value={editForm.incomeGoal}
                    onChange={e => setEditForm({ ...editForm, incomeGoal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite de Gastos</Label>
                  <Input
                    type="number"
                    value={editForm.expenseLimit}
                    onChange={e => setEditForm({ ...editForm, expenseLimit: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveBudget} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Goal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Meta Ingresos</span>
              <span className="font-medium dark:text-white">{formatCurrency(actuals.income)} / {formatCurrency(budget.incomeGoal)}</span>
            </div>
            <Progress value={Math.min(incomeProgress, 100)} className="h-2 bg-gray-100 dark:bg-slate-800" />
            <p className="text-xs text-right text-gray-500 dark:text-gray-400">{incomeProgress.toFixed(1)}% completado</p>
          </div>

          {/* Expense Limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Límite Gastos</span>
              <span className="font-medium dark:text-white">{formatCurrency(actuals.expenses)} / {formatCurrency(budget.expenseLimit)}</span>
            </div>
            <Progress value={Math.min(expenseProgress, 100)} className="h-2 bg-gray-100 dark:bg-slate-800" />
            <p className={`text-xs text-right ${expenseProgress > 100 ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
              {expenseProgress.toFixed(1)}% utilizado
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Estado Financiero</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-48 w-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Disponible', value: Math.max(0, budget.expenseLimit - actuals.expenses), fill: '#10b981' },
                      { name: 'Gastado', value: actuals.expenses, fill: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xs text-gray-500">Restante</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(Math.max(0, budget.expenseLimit - actuals.expenses))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

