import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  CreditCard,
  Lock,
  ShieldCheck,
  Clock,
  PieChart as PieChartIcon,
  AlertCircle
} from 'lucide-react';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { useAuthStore } from '@/stores';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { financesApi } from '@/lib/api';
import { useWalletStore } from '@/stores/walletStore';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { usePaywallStore } from '@/stores';

export default function IngenioDashboard() {
  const { user } = useAuthStore();
  const { fetchWallet } = useWalletStore();
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    assets: 0,
    liabilities: 0,
    netWorth: 0,
    netWorthGrowth: 0,
    todayBalance: 0,
    balance: 0
  });
  const { status, isActive, isReadOnly, subscription } = useIngenioSubscription();
  const { openPaywall } = usePaywallStore();
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'expense',
    amount: '',
    description: '',
    notes: '',
    date: new Date().toLocaleDateString('en-CA')
  });

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
      if (status !== 'NONE') {
        fetchData();
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
      setSummary({
        income: data.monthIncome || 0,
        expenses: data.monthExpenses || 0,
        assets: data.totalAssets || 0,
        liabilities: data.totalLiabilities || 0,
        netWorth: data.netWorth || 0,
        netWorthGrowth: data.savingsRate || 0,
        todayBalance: data.todayBalance || 0,
        balance: data.balance || 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      openPaywall();
      return;
    }

    if (!newRecord.amount || isNaN(Number(newRecord.amount.replace(/\D/g, '')))) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    try {
      await financesApi.create({
        ...newRecord,
        amount: Number(newRecord.amount.replace(/\D/g, ''))
      });

      toast.success('Registro guardado exitosamente');
      setIsAddOpen(false);
      setNewRecord({ type: 'expense', amount: '', description: '', notes: '', date: new Date().toLocaleDateString('en-CA') });
      fetchData();
    } catch (error: any) {
      if (error.message.includes('Suscripción requerida') || error.message.includes('REQUIRES_SUBSCRIPTION')) {
        openPaywall();
      } else {
        toast.error(error.message || 'Error al guardar');
      }
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Optimizando tu tablero financiero...</div>;
  if (status !== 'ACTIVE') {
    return <AccessDenied status={status} />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Finanzas Master</h1>
          <p className="text-slate-500 font-medium">Control absoluto sobre tu flujo de caja y patrimonio neto.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          if (open && isReadOnly) {
            openPaywall();
            return;
          }
          setIsAddOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className={cn(
              "h-12 px-6 rounded-xl shadow-lg transition-all font-bold",
              isReadOnly 
                ? "bg-slate-400 dark:bg-slate-700 hover:bg-slate-500" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
            )}>
              {isReadOnly ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nuevo Registro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRecord} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="font-bold">Tipo de Movimiento</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(val) => setNewRecord({ ...newRecord, type: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Ingreso</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="asset">Activo (Suma Patrimonio)</SelectItem>
                    <SelectItem value="liability">Pasivo (Resta Patrimonio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Monto (₲)</Label>
                <Input
                  type="text"
                  placeholder="0"
                  value={newRecord.amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setNewRecord({ ...newRecord, amount: '' });
                      return;
                    }
                    const num = parseInt(raw, 10);
                    setNewRecord({ ...newRecord, amount: num.toLocaleString('es-PY') });
                  }}
                  className="h-12 rounded-xl text-lg font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Nomb. de Registro</Label>
                <Input
                  placeholder="Ej: Salario, Inversión, etc."
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Descripción</Label>
                <Input
                  placeholder="Detalles adicionales..."
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Fecha</Label>
                <Input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg">Guardar Registro</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence>
        {isActive && subscription && subscription.paidAmount < subscription.totalAmount && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border-2 border-white/10">
               <div>
                  <p className="font-bold text-xs uppercase tracking-widest text-indigo-100 mb-1">Pago Pendiente</p>
                  <p className="text-base font-bold">Has abonado {formatCurrency(subscription.paidAmount)} de {formatCurrency(subscription.totalAmount)}.</p>
               </div>
               <Button size="sm" variant="secondary" className="font-bold h-11 px-8 rounded-2xl shadow-lg" onClick={openPaywall}>
                 Pagar Próxima Cuota
               </Button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white border-none shadow-2xl relative overflow-hidden rounded-[2rem]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardContent className="p-8 relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">Patrimonio Neto Global</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{formatCurrency(summary.netWorth)}</span>
                </div>
              </div>
              <Badge className={cn(
                "h-10 px-4 font-black rounded-full border-none",
                summary.netWorthGrowth >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {summary.netWorthGrowth >= 0 ? <TrendingUp className="w-5 h-5 mr-1.5" /> : <TrendingDown className="w-5 h-5 mr-1.5" />}
                {summary.netWorthGrowth.toFixed(1)}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Activos Totales</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(summary.assets)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Pasivos Totales</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(summary.liabilities)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 relative overflow-hidden rounded-3xl">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
            <CardContent className="p-8 pl-10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ingresos del Mes</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{formatCurrency(summary.income)}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-inner">
                  <ArrowDownRight className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 relative overflow-hidden rounded-3xl">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-500" />
            <CardContent className="p-8 pl-10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Egresos del Mes</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shadow-inner">
                  <ArrowUpRight className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 relative overflow-hidden rounded-3xl">
            <div className={cn("absolute left-0 top-0 bottom-0 w-2", summary.balance >= 0 ? "bg-indigo-500" : "bg-rose-500")} />
            <CardContent className="p-8 pl-10">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Saldo de Caja</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{formatCurrency(summary.balance)}</p>
                  <p className={cn("text-xs font-bold mt-2", summary.todayBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    Hoy: {summary.todayBalance >= 0 ? '+' : ''}{formatCurrency(summary.todayBalance)}
                  </p>
                </div>
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", summary.balance >= 0 ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-rose-50 dark:bg-rose-500/10")}>
                  <Wallet className={cn("w-8 h-8", summary.balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

     <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-black dark:text-white">Flujo de Caja Real</h2>
            <Badge variant="outline" className="font-bold border-slate-200">Balance Mensual</Badge>
          </div>
          <CardContent className="p-8">
            <div className="h-80 mt-4">
              {summary && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Ingresos", valor: summary.income },
                    { name: "Gastos", valor: summary.expenses }
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748B", fontWeight: 700, fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: "#94A3B8"}} tickFormatter={(val) => `₲${val / 1000}k`} />
                    <Tooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                    />
                    <Bar dataKey="valor" radius={[12, 12, 0, 0]} barSize={90}>
                      {
                        [summary.income, summary.expenses].map((val, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "#F43F5E"} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
