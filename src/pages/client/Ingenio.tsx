import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieChartIcon,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  CreditCard,
  BookOpen,
  Play,
  Lock,
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { cn, formatCurrency } from '@/lib/utils';
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
import { financesApi, coursesApi, settingsApi, walletApi, usersApi, ingenioApi } from '@/lib/api';
import { useWalletStore } from '@/stores/walletStore';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';

// 5S Methodology Cards
const ssCards = [
  { title: 'Seiri', subtitle: 'Clasificación', description: 'Organiza tus gastos por categorías', color: 'bg-red-500', icon: Target },
  { title: 'Seiton', subtitle: 'Orden', description: 'Estructura tu presupuesto mensual', color: 'bg-blue-500', icon: PieChartIcon },
  { title: 'Seiso', subtitle: 'Limpieza', description: 'Elimina gastos innecesarios', color: 'bg-green-500', icon: TrendingDown },
  { title: 'Seiketsu', subtitle: 'Estandarización', description: 'Crea hábitos financieros', color: 'bg-yellow-500', icon: Wallet },
  { title: 'Shitsuke', subtitle: 'Disciplina', description: 'Mantén el control constante', color: 'bg-purple-500', icon: Target },
];

export default function ClientIngenio() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchWallet } = useWalletStore();
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    assets: 0,
    liabilities: 0,
    netWorth: 0,
    netWorthGrowth: 0
  });
  const [courses, setCourses] = useState([]);
  const { status, isActive, isReadOnly, subscription } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();
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
    if (user) {
      fetchWallet(user.id);
      if (status !== 'NONE') {
        fetchData();
        fetchCourses();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user, status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await financesApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      openPaywall();
      return;
    }

    if (!newRecord.amount || isNaN(Number(newRecord.amount))) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    try {
      if (newRecord.type === 'budget') {
        const dateObj = new Date(newRecord.date);
        await financesApi.createBudget({
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear(),
          incomeGoal: Number(newRecord.amount),
          expenseLimit: Number(newRecord.description)
        });
      } else {
        await financesApi.create({
          ...newRecord,
          amount: Number(newRecord.amount)
        });
      }

      toast.success(newRecord.type === 'budget' ? 'Presupuesto actualizado' : 'Registro guardado');
      setIsAddOpen(false);
      setNewRecord({ type: 'expense', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error: any) {
      if (error.message.includes('Suscripción requerida') || error.message.includes('REQUIRES_SUBSCRIPTION')) {
        openPaywall();
      } else {
        toast.error(error.message || 'Error al guardar');
      }
    }
  };

  if (status === 'NONE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          <Target className="w-12 h-12 text-indigo-600" />
        </motion.div>
        
        <Badge className="mb-4 bg-indigo-600 hover:bg-indigo-600">Módulo Premium</Badge>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Ingenio Millonario</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
          Toma el control total de tu libertad financiera. Gestiona activos, pasivos y aprende con los mejores cursos de educación financiera.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-10">
          {[
            { title: "Metodología 5S", desc: "Clasifica y ordena tus finanzas", icon: Target },
            { title: "Gestión Patrimonial", desc: "Monitorea activos y pasivos", icon: Wallet },
            { title: "Academia Premium", desc: "Cursos exclusivos incluidos", icon: BookOpen },
            { title: "Presupuesto Inteligente", desc: "Cumple tus metas mensuales", icon: PieChartIcon }
          ].map((item, i) => (
            <Card key={i} className="border-none bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          onClick={openPaywall}
          className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-lg"
        >
          Solicitar Acceso Full
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
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
      </div>

      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className={cn(
              "p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 shadow-lg",
              status === 'PENDING_APPROVAL' 
                ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400"
                : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-800 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-900/30 dark:text-indigo-400"
            )}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                  status === 'PENDING_APPROVAL' ? "bg-amber-100 dark:bg-amber-900/40" : "bg-indigo-100 dark:bg-indigo-900/40"
                )}>
                  {status === 'PENDING_APPROVAL' ? <Clock className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-extrabold text-base mb-0.5">
                    {status === 'PENDING_APPROVAL' ? 'Verificando Suscripción...' : '¡Desbloquea Todo el Potencial!'}
                  </p>
                  <p className="text-sm font-medium opacity-90 max-w-lg">
                    {status === 'PENDING_APPROVAL' 
                      ? 'Estamos confirmando tu pago. Tendrás acceso total en menos de 24 horas.' 
                      : 'Actualmente estás en Modo Lectura. Adquiere el Acceso a Ingenio Millonario para registrar movimientos y usar la Academia.'}
                  </p>
                </div>
              </div>
              {status !== 'PENDING_APPROVAL' && (
                <Button 
                  size="lg" 
                  onClick={openPaywall}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md px-8 h-12"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Obtener Acceso
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {isActive && subscription && subscription.paidAmount < subscription.totalAmount && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="px-4 overflow-hidden"
           >
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border-2 border-white/10">
               <div>
                  <p className="font-bold text-sm mb-1 uppercase tracking-wider text-indigo-100">Pago Pendiente</p>
                  <p className="text-sm font-medium">Has abonado {formatCurrency(subscription.paidAmount)} de {formatCurrency(subscription.totalAmount)}.</p>
               </div>
               <Button size="sm" variant="secondary" className="font-bold h-10 px-6 rounded-xl" onClick={openPaywall}>
                 Pagar Próxima Cuota
               </Button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4">
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          if (open && isReadOnly) {
            openPaywall();
            return;
          }
          setIsAddOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button size="icon" className={cn(
              "rounded-full h-12 w-12 shadow-xl transition-all fixed bottom-24 right-6 z-50",
              isReadOnly 
                ? "bg-slate-400 dark:bg-slate-700 hover:bg-slate-500" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
            )}>
              {isReadOnly ? <Lock className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
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
                  </div>
                  <div className="space-y-2">
                    <Label>Meta de Ingresos</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Límite de Gastos</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newRecord.description}
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
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="px-4">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-12">
          <TabsTrigger value="dashboard" className="rounded-xl font-bold">Finanzas</TabsTrigger>
          <TabsTrigger value="budget" className="rounded-xl font-bold">Presupuesto</TabsTrigger>
          <TabsTrigger value="education" className="rounded-xl font-bold">Academia</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute -right-2 -bottom-2 opacity-20"><TrendingUp className="w-20 h-20" /></div>
              <CardContent className="p-5">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Ingresos</p>
                <p className="text-2xl font-black">{formatCurrency(summary.income)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute -right-2 -bottom-2 opacity-20"><TrendingDown className="w-20 h-20" /></div>
              <CardContent className="p-5">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Egresos</p>
                <p className="text-2xl font-black">{formatCurrency(summary.expenses)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Patrimonio Neto</p>
                  <p className={`text-4xl font-black ${summary.netWorth >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                    {formatCurrency(summary.netWorth)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    "h-8 px-4 font-black rounded-full",
                    summary.netWorthGrowth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {summary.netWorthGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {summary.netWorthGrowth.toFixed(1)}%
                  </Badge>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">vs mes anterior</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Activos</p>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(summary.assets)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Pasivos</p>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(summary.liabilities)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 ml-1">Metodología 5S</h2>
            <div className="grid grid-cols-2 gap-4">
              {ssCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all border-none bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-inner`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-black text-slate-900 dark:text-white text-base leading-tight">{card.title}</p>
                      <p className="text-xs text-slate-500 font-bold opacity-80">{card.subtitle}</p>
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
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">No hay contenido disponible.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course: any) => (
                <Card key={course.id} className="overflow-hidden border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl" onClick={() => navigate(`/app/cursos/${course.id}`)}>
                  <div className="h-40 bg-slate-100 dark:bg-slate-800 relative">
                    {course.coverImage ? (
                      <img src={course.coverImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 text-slate-900 hover:bg-white border-none font-bold backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-black text-xl mb-1 dark:text-white leading-tight">{course.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        <BookOpen className="w-3 h-3" />
                        {course.modules?.length || 0} módulos
                      </div>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full font-bold h-10 px-6">
                        Estudiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BudgetSection() {
  const [budget, setBudget] = useState({ incomeGoal: 0, expenseLimit: 0 });
  const [actuals, setActuals] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ incomeGoal: '', expenseLimit: '' });

  const { isReadOnly } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const data = await financesApi.getBudget(month, year);
      setBudget(data.budget);
      setActuals(data.actuals);
      setEditForm({
        incomeGoal: data.budget.incomeGoal.toString(),
        expenseLimit: data.budget.expenseLimit.toString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (isReadOnly) {
      openPaywall();
      return;
    }

    try {
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      await financesApi.createBudget({
        month,
        year,
        incomeGoal: Number(editForm.incomeGoal),
        expenseLimit: Number(editForm.expenseLimit)
      });
      toast.success('Presupuesto actualizado');
      setIsEditing(false);
      fetchBudget();
    } catch (error: any) {
      if (error.message.includes('Suscripción requerida') || error.message.includes('REQUIRES_SUBSCRIPTION')) {
        openPaywall();
      } else {
        toast.error(error.message || 'Error al guardar presupuesto');
      }
    }
  };

  const incomeProgress = budget.incomeGoal > 0 ? (actuals.income / budget.incomeGoal) * 100 : 0;
  const expenseProgress = budget.expenseLimit > 0 ? (actuals.expenses / budget.expenseLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b dark:border-slate-800 mb-6">
          <div>
            <CardTitle className="text-xl font-black dark:text-white">Metas Mensuales</CardTitle>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control de objetivos</p>
          </div>
          <Dialog open={isEditing} onOpenChange={(open) => {
            if (open && isReadOnly) {
              openPaywall();
              return;
            }
            setIsEditing(open);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-5 border-slate-200">
                {isReadOnly ? <Lock className="w-4 h-4 mr-2" /> : null}
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="text-2xl font-black text-center">Configurar Metas</DialogTitle></DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="font-bold">Meta de Ingresos</Label>
                  <Input
                    type="number"
                    value={editForm.incomeGoal}
                    onChange={e => setEditForm({ ...editForm, incomeGoal: e.target.value })}
                    className="h-12 rounded-xl text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Límite de Gastos</Label>
                  <Input
                    type="number"
                    value={editForm.expenseLimit}
                    onChange={e => setEditForm({ ...editForm, expenseLimit: e.target.value })}
                    className="h-12 rounded-xl text-lg font-bold"
                  />
                </div>
                <Button onClick={handleSaveBudget} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg">Guardar Cambios</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Estado de Ingresos</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(actuals.income)} de {formatCurrency(budget.incomeGoal)}</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-black">{incomeProgress.toFixed(0)}%</Badge>
            </div>
            <Progress value={Math.min(incomeProgress, 100)} className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-1">Control de Gastos</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(actuals.expenses)} de {formatCurrency(budget.expenseLimit)}</span>
              </div>
              <Badge className={cn(
                "font-black border-none",
                expenseProgress > 100 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
              )}>{expenseProgress.toFixed(0)}%</Badge>
            </div>
            <Progress value={Math.min(expenseProgress, 100)} className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full" />
            {expenseProgress > 100 && (
              <p className="text-[10px] font-bold text-rose-600 uppercase animate-bounce mt-1">¡Has superado tu límite de gastos!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
