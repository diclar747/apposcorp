import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Lock,
  ShieldCheck,
  Clock,
  PieChart as PieChartIcon,
  Trash2,
  Edit
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { financesApi } from '@/lib/api';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';

export default function IngenioBudget() {
  const [budget, setBudget] = useState({ incomeGoal: 0, expenseLimit: 0, durationMonths: 1, startDate: '' as any });
  const [actuals, setActuals] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ incomeGoal: '', expenseLimit: '', durationMonths: '1' });
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Reactivation state
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [reactivateDuration, setReactivateDuration] = useState('1');

  // Manual Log state
  const [logAmount, setLogAmount] = useState('');
  const [logType, setLogType] = useState<'income' | 'expense'>('income');
  const [logId, setLogId] = useState<string | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const cleanDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
  };

  // Specific Budget Items
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState({
    type: 'expense',
    name: '',
    description: '',
    amount: '',
    durationMonths: '1'
  });

  const { status, isActive, isReadOnly } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();

  if (status !== 'ACTIVE') {
    return <AccessDenied status={status} />;
  }

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const data = await financesApi.getBudget(month, year);
      setBudget(data.budget || { incomeGoal: 0, expenseLimit: 0, durationMonths: 1, startDate: '' as any });
      setActuals(data.actuals || { income: 0, expenses: 0 });
      
      const incomeGoal = data.budget?.incomeGoal || 0;
      const expenseLimit = data.budget?.expenseLimit || 0;

      setEditForm({
        incomeGoal: incomeGoal > 0 ? incomeGoal.toLocaleString('es-PY') : '',
        expenseLimit: expenseLimit > 0 ? expenseLimit.toLocaleString('es-PY') : '',
        durationMonths: (data.budget?.durationMonths || 1).toString()
      });

      // Fetch specific items
      const items = await financesApi.getBudgetItems(month, year);
      setBudgetItems(items || []);
    } catch (error: any) {
      console.error('Error fetching budget:', error);
      toast.error('Error al cargar datos del presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      openPaywall();
      return;
    }

    if (!newBudgetItem.amount || !newBudgetItem.name) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      const date = new Date();
      await financesApi.createBudgetItem({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        type: newBudgetItem.type,
        name: newBudgetItem.name,
        description: newBudgetItem.description,
        amount: Number(newBudgetItem.amount.replace(/\D/g, '')),
        durationMonths: Number(newBudgetItem.durationMonths)
      });

      toast.success('Presupuesto creado con éxito');
      setIsAddBudgetOpen(false);
      setNewBudgetItem({ 
        type: 'expense', 
        name: '', 
        description: '', 
        amount: '',
        durationMonths: (budget.durationMonths || 1).toString()
      });
      fetchBudget();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear presupuesto');
    }
  };

  const handleDeleteBudgetItem = async (id: string) => {
    try {
      await financesApi.deleteBudgetItem(id);
      toast.success('Presupuesto eliminado');
      fetchBudget();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleUpdateMonthlyGoals = async () => {
    try {
      const date = new Date();
      await financesApi.createBudget({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        incomeGoal: Number(editForm.incomeGoal.replace(/\D/g, '')),
        expenseLimit: Number(editForm.expenseLimit.replace(/\D/g, '')),
        durationMonths: Number(editForm.durationMonths)
      });
      toast.success('Metas actualizadas');
      setIsEditing(false);
      fetchBudget();
    } catch (error: any) {
      toast.error('Error al actualizar metas');
    }
  };

  const handleUpdateBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financesApi.updateBudgetItem(editingItem.id, {
        type: editingItem.type,
        name: editingItem.name,
        description: editingItem.description,
        amount: Number(editingItem.amount.toString().replace(/\D/g, '')),
        durationMonths: Number(editingItem.durationMonths)
      });
      toast.success('Presupuesto actualizado');
      setIsEditingItem(false);
      setEditingItem(null);
      fetchBudget();
    } catch (error: any) {
      toast.error('Error al actualizar');
    }
  };

  const handleLogProgress = async (id: string, amount: number) => {
    const item = budgetItems.find(i => i.id === id);
    if (item) {
      const projected = item.actualAmount + amount;
      if (projected < 0) {
        toast.error('El monto no puede quedar en negativo');
        return;
      }
      if (projected > item.amount) {
        toast.error('El monto no puede superar la meta');
        return;
      }
    }

    try {
      await financesApi.logBudgetItemProgress(id, amount);
      toast.success(amount > 0 ? 'Monto ingresado' : 'Monto retirado');
      fetchBudget();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar');
    }
  };

  const handleReactivateItem = async () => {
    if (!reactivateId) return;
    try {
      await financesApi.reactivateBudgetItem(reactivateId, Number(reactivateDuration));
      toast.success('Ciclo reiniciado con éxito');
      setIsReactivateOpen(false);
      setReactivateId(null);
      fetchBudget();
    } catch (error) {
      toast.error('Error al reactivar');
    }
  };

  const incomeProgress = budget.incomeGoal > 0 ? (actuals.income / budget.incomeGoal) * 100 : 0;
  const expenseProgress = budget.expenseLimit > 0 ? (actuals.expenses / budget.expenseLimit) * 100 : 0;

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Calculando tus proyecciones...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Presupuesto y Metas</h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Vigencia: <span className="text-indigo-600 font-bold">{budget.durationMonths} {budget.durationMonths === 1 ? 'mes' : 'meses'}</span> 
            {budget.startDate && ` desde ${formatDate(budget.startDate)}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Dialog open={isAddBudgetOpen} onOpenChange={(open) => {
            if (open && isReadOnly) {
              openPaywall();
              return;
            }
            setIsAddBudgetOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-xl border-dashed border-2 font-bold gap-2">
                <Plus className="w-4 h-4" /> Crear Presupuesto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Nuevo Presupuesto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBudgetItem} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tipo de Presupuesto</Label>
                  <Select
                    value={newBudgetItem.type}
                    onValueChange={(val) => setNewBudgetItem({ ...newBudgetItem, type: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Presup. de Ingreso</SelectItem>
                      <SelectItem value="expense">Presup. de Egresos</SelectItem>
                      <SelectItem value="asset">Presup. de Activos</SelectItem>
                      <SelectItem value="liability">Presup. de Pasivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Nombre</Label>
                  <Input
                    placeholder="Ej: Ahorro para casa, Viaje, etc."
                    value={newBudgetItem.name}
                    onChange={(e) => setNewBudgetItem({ ...newBudgetItem, name: e.target.value })}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Descripción</Label>
                  <Input
                    placeholder="Detalles adicionales..."
                    value={newBudgetItem.description}
                    onChange={(e) => setNewBudgetItem({ ...newBudgetItem, description: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Monto (₲)</Label>
                  <Input
                    type="text"
                    placeholder="0"
                    value={newBudgetItem.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setNewBudgetItem({ ...newBudgetItem, amount: raw ? parseInt(raw, 10).toLocaleString('es-PY') : '' });
                    }}
                    className="h-12 rounded-xl text-lg font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 pb-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-slate-400">Duración Plan (Meses)</Label>
                    <Select
                      value={newBudgetItem.durationMonths}
                      onValueChange={(val) => setNewBudgetItem({ ...newBudgetItem, durationMonths: val })}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 6, 12].map(m => <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'Mes' : 'Meses'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg">Guardar Presupuesto</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditing} onOpenChange={(open) => {
            if (open && isReadOnly) {
              openPaywall();
              return;
            }
            setIsEditing(open);
          }}>
            <DialogTrigger asChild>
              <Button className={cn(
                "h-12 px-6 rounded-xl shadow-lg transition-all font-bold",
                isReadOnly 
                  ? "bg-slate-400 dark:bg-slate-700 hover:bg-slate-500" 
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}>
                {isReadOnly ? <Lock className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Metas Mensuales
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-center">Configurar Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="font-bold">Meta de Ingresos Mensual</Label>
                  <Input
                    type="text"
                    value={editForm.incomeGoal}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setEditForm({ ...editForm, incomeGoal: raw ? parseInt(raw, 10).toLocaleString('es-PY') : '' });
                    }}
                    className="h-12 rounded-xl text-lg font-bold border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Límite de Gastos Permitido</Label>
                  <Input
                    type="text"
                    value={editForm.expenseLimit}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setEditForm({ ...editForm, expenseLimit: raw ? parseInt(raw, 10).toLocaleString('es-PY') : '' });
                    }}
                    className="h-12 rounded-xl text-lg font-bold border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Duración (Meses)</Label>
                    <Select value={editForm.durationMonths} onValueChange={v => setEditForm({...editForm, durationMonths: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,6,12].map(m => <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'Mes' : 'Meses'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateMonthlyGoals}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg"
                >
                  Actualizar Planificación
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" /> Estado de Metas
            </CardTitle>
            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none">Balance Actual</Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Monto de Ingresos</p>
                  <p className="text-2xl font-black dark:text-white">{formatCurrency(actuals.income)} <span className="text-slate-300 font-bold">/ {formatCurrency(budget.incomeGoal)}</span></p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-black h-8 px-3 rounded-full">{incomeProgress.toFixed(0)}%</Badge>
              </div>
              <Progress value={Math.min(incomeProgress, 100)} className="h-4 bg-slate-50 dark:bg-slate-900 rounded-full" />
            </div>

            <div className="space-y-4 pt-6 border-t border-dashed dark:border-slate-800">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Control de Gastos</p>
                  <p className="text-2xl font-black dark:text-white">{formatCurrency(actuals.expenses)} <span className="text-slate-300 font-bold">/ {formatCurrency(budget.expenseLimit)}</span></p>
                </div>
                <Badge className={cn(
                  "font-black border-none h-8 px-3 rounded-full",
                  expenseProgress > 100 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                )}>{expenseProgress.toFixed(0)}%</Badge>
              </div>
              <Progress value={Math.min(expenseProgress, 100)} className="h-4 bg-slate-50 dark:bg-slate-900 rounded-full" />
              {expenseProgress > 100 && (
                 <p className="text-xs font-bold text-rose-600 uppercase tracking-widest animate-pulse">Límite de gastos excedido</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b dark:border-slate-800">
            <CardTitle className="text-xl font-black dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-indigo-500" /> Diagnóstico Visual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex items-center justify-center">
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Disponible', value: Math.max(0, budget.expenseLimit - actuals.expenses) },
                      { name: 'Gastado', value: actuals.expenses }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#38BDF8" className="drop-shadow-sm" />
                    <Cell fill="#F43F5E" className="drop-shadow-sm" />
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)} 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Libre</p>
                <p className={cn(
                  "text-3xl font-black leading-none",
                  budget.expenseLimit - actuals.expenses < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                )}>
                  {formatCurrency(Math.max(0, budget.expenseLimit - actuals.expenses))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Detalle de Presupuestos</h2>
          <div className="relative w-full md:w-80">
            <Input 
              placeholder="Buscar meta o descripción..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 h-11 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
          ).map((item) => {
            const startDate = new Date(item.startDate);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + (item.durationMonths || 1));
            const isExpired = new Date() > endDate;
            const progress = item.amount > 0 ? (item.actualAmount / item.amount) * 100 : 0;

            return (
              <Card key={item.id} className={cn(
                "border-none shadow-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800",
                isExpired && "opacity-80 grayscale-[0.5]"
              )}>
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                      <Badge className={cn(
                        "font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full border-none w-fit",
                        item.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.type === 'expense' ? 'bg-rose-500/10 text-rose-500' :
                        item.type === 'asset' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      )}>
                        {item.type === 'income' ? 'Ingreso' : 
                         item.type === 'expense' ? 'Egreso' :
                         item.type === 'asset' ? 'Activo' : 'Pasivo'}
                      </Badge>
                      {isExpired && <Badge className="bg-slate-200 text-slate-600 font-black text-[10px] uppercase">Finalizado</Badge>}
                    </div>
                    <div className="flex items-center gap-1 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-300 hover:text-indigo-500"
                        onClick={() => {
                          setEditingItem({
                            ...item,
                            amount: item.amount.toLocaleString('es-PY'),
                            durationMonths: (item.durationMonths || 1).toString()
                          });
                          setIsEditingItem(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-300 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black">¿Eliminar presupuesto?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium text-base">
                              Esta acción no se puede deshacer. Se borrará permanentemente la meta "{item.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-2xl h-12 border-slate-100 font-bold">Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteBudgetItem(item.id)}
                              className="rounded-2xl h-12 bg-rose-500 hover:bg-rose-600 font-black px-6"
                            >
                              Confirmar Eliminación
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{item.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium line-clamp-3 min-h-[3rem]">{item.description}</p>
                  
                  <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    <span>{item.durationMonths} {item.durationMonths === 1 ? 'Mes' : 'Meses'}</span>
                    {item.startDate && <span>• {formatDate(item.startDate)} → {formatDate(endDate.toISOString())}</span>}
                  </div>
                  
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Progreso del Ciclo</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(item.actualAmount)} <span className="text-xs text-slate-400 font-bold">/ {formatCurrency(item.amount)}</span></p>
                    </div>
                  </div>

                  {!isExpired && (
                    <Button 
                      onClick={() => {
                        setLogId(item.id);
                        setLogAmount('');
                        setLogType(item.type === 'income' ? 'income' : 'expense');
                        setIsLogOpen(true);
                      }}
                      className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-base gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                      <Plus className="w-4 h-4" /> Registrar Movimiento
                    </Button>
                  )}

                  {isExpired && (
                    <Button 
                      onClick={() => {
                        setReactivateId(item.id);
                        setIsReactivateOpen(true);
                      }}
                      className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg gap-2"
                    >
                      <Clock className="w-5 h-5" /> Reactivar Meta
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {budgetItems.length === 0 && (
             <div className="col-span-full py-20 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Target className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Sin presupuestos específicos</h3>
                <p className="text-sm text-slate-400 mt-1">Crea metas detalladas para este mes pulsando en "Crear Presupuesto"</p>
             </div>
          )}
        </div>
      </div>

      <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Editar Meta de Presupuesto</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdateBudgetItem} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="font-bold">Tipo</Label>
                <Select
                  value={editingItem.type}
                  onValueChange={(val) => setEditingItem({ ...editingItem, type: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Presup. de Ingreso</SelectItem>
                    <SelectItem value="expense">Presup. de Egresos</SelectItem>
                    <SelectItem value="asset">Presup. de Activos</SelectItem>
                    <SelectItem value="liability">Presup. de Pasivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Nombre</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Descripción</Label>
                <Input
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Monto (₲)</Label>
                <Input
                  type="text"
                  value={editingItem.amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setEditingItem({ ...editingItem, amount: raw ? parseInt(raw, 10).toLocaleString('es-PY') : '' });
                  }}
                  className="h-12 rounded-xl text-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Duración (Meses)</Label>
                    <Select 
                      value={editingItem.durationMonths} 
                      onValueChange={v => setEditingItem({...editingItem, durationMonths: v})}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,6,12].map(m => <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'Mes' : 'Meses'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg">Actualizar Cambios</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Registrar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <Button 
                onClick={() => setLogType('income')}
                className={cn(
                  "flex-1 rounded-xl font-bold h-11 transition-all",
                  logType === 'income' ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600" : "bg-transparent text-slate-500"
                )}
                variant="ghost"
              >Ingreso</Button>
              <Button 
                onClick={() => setLogType('expense')}
                className={cn(
                  "flex-1 rounded-xl font-bold h-11 transition-all",
                  logType === 'expense' ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600" : "bg-transparent text-slate-500"
                )}
                variant="ghost"
              >Egreso</Button>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Monto (₲)</Label>
              <Input 
                type="text" 
                placeholder="0" 
                value={logAmount}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setLogAmount(raw ? parseInt(raw, 10).toLocaleString('es-PY') : '');
                }}
                className="h-12 rounded-xl text-lg font-bold"
              />
            </div>
            <Button 
              onClick={() => {
                if (!logAmount || !logId) return;
                const finalAmount = Number(logAmount.replace(/\D/g, '')) * (logType === 'income' ? 1 : -1);
                handleLogProgress(logId, finalAmount);
                setIsLogOpen(false);
              }}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg"
            >
              Confirmar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reactivation Dialog */}
      <Dialog open={isReactivateOpen} onOpenChange={setIsReactivateOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Reactivar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm font-medium text-slate-500">
              El progreso actual se guardará en tu historial y el contador volverá a 0 para un nuevo ciclo.
            </p>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-400">Nueva Duración (Meses)</Label>
              <Select
                value={reactivateDuration}
                onValueChange={setReactivateDuration}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map(m => <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'Mes' : 'Meses'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleReactivateItem}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg"
            >
              Iniciar Nuevo Ciclo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
