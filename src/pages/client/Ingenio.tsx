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
  Play,
  CheckCircle,
  Clock,
  Shield,
  BarChart3,
  GraduationCap,
  Loader2,
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
import { ingenioApi } from '@/lib/api';

// 5S Methodology Cards
const ssCards = [
  { title: 'Seiri', subtitle: 'Clasificación', description: 'Organiza tus gastos por categorías', color: 'bg-red-500', icon: Target },
  { title: 'Seiton', subtitle: 'Orden', description: 'Estructura tu presupuesto mensual', color: 'bg-blue-500', icon: PieChartIcon },
  { title: 'Seiso', subtitle: 'Limpieza', description: 'Elimina gastos innecesarios', color: 'bg-green-500', icon: TrendingDown },
  { title: 'Seiketsu', subtitle: 'Estandarización', description: 'Crea hábitos financieros', color: 'bg-yellow-500', icon: Wallet },
  { title: 'Shitsuke', subtitle: 'Disciplina', description: 'Mantén el control constante', color: 'bg-purple-500', icon: Target },
];

interface ProgramInfo {
  name: string;
  price: number;
  currency: string;
  installmentOptions: { installments: number; amount: number; label: string }[];
  includes: string[];
  coursesCount: number;
  description: string;
}

interface Subscription {
  id: string;
  totalAmount: number;
  amountPaid: number;
  installments: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  activatedAt: string | null;
  payments: { id: string; amount: number; paymentNumber: number; paidAt: string }[];
}

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

  // Subscription/Payment State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (user?.ingenioAccess) {
      fetchData();
      fetchCourses();
    } else {
      fetchSubscriptionStatus();
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finances/summary', {
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
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const sub = await ingenioApi.getSubscription();
      setSubscription(sub);
    } catch {
      // No subscription yet
    }
    try {
      const walletRes = await fetch('/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWalletBalance(walletData.balance);
      }
    } catch {
      // Wallet not found
    }
  };

  const handleOpenAccessModal = async () => {
    try {
      const info = await ingenioApi.getProgram();
      setProgramInfo(info);
      await fetchSubscriptionStatus();
      setIsAccessModalOpen(true);
    } catch {
      toast.error('Error al cargar información del programa');
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const result = await ingenioApi.subscribe(selectedInstallments);
      setSubscription(result);
      toast.success(
        selectedInstallments === 1
          ? 'Acceso activado correctamente'
          : 'Primer pago registrado exitosamente'
      );
      if (selectedInstallments === 1) {
        setIsAccessModalOpen(false);
        // Reload page to show full dashboard
        window.location.reload();
      } else {
        await fetchSubscriptionStatus();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayInstallment = async () => {
    setIsProcessing(true);
    try {
      const result = await ingenioApi.pay();
      setSubscription(result);
      const isFullyPaid = result.status === 'completed';
      toast.success(
        isFullyPaid
          ? 'Pago completado. Tu acceso ha sido activado'
          : 'Cuota pagada exitosamente'
      );
      if (isFullyPaid) {
        setIsAccessModalOpen(false);
        window.location.reload();
      } else {
        await fetchSubscriptionStatus();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let url = '/api/finances';
      let body: any = newRecord;

      if (newRecord.type === 'budget') {
        const dateObj = new Date(newRecord.date);
        url = '/api/finances/budget';
        body = {
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear(),
          incomeGoal: Number(newRecord.amount),
          expenseLimit: Number(newRecord.description)
        };
      } else {
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
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // ========== NO ACCESS VIEW ==========
  if (!user?.ingenioAccess) {
    const hasPartialSubscription = subscription && subscription.status === 'partial';

    return (
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ingenio Millonario</h1>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Hero Card */}
          <Card className="overflow-hidden border-none shadow-xl">
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Programa Ingenio Millonario</h2>
                  <p className="text-purple-200 text-sm">Educación Financiera Integral</p>
                </div>
              </div>
              <p className="text-purple-100 text-sm leading-relaxed mb-4">
                Programa integral de Educación Financiera con metodología de Aula Invertida.
                Incluye acceso a todos los cursos, herramientas de gestión financiera personal
                y acompañamiento con la aplicación.
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{formatCurrency(700000)}</span>
                <span className="text-purple-200 text-sm">pago único o en cuotas</span>
              </div>
            </div>
          </Card>

          {/* What's Included */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold dark:text-white">
                Qué incluye el programa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: GraduationCap, text: 'Todos los cursos de Educación Financiera', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
                { icon: BarChart3, text: 'Módulo de Gestión de Ingresos y Egresos', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                { icon: Target, text: 'Presupuestos de Gastos y Ganancias', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
                { icon: Shield, text: 'Metodología 5S aplicada a Finanzas', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
                { icon: PieChartIcon, text: 'Matriz Financiera Personalizada', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
                { icon: CheckCircle, text: 'Certificación al completar el programa', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Partial Payment Progress */}
          {hasPartialSubscription && (
            <Card className="border-purple-200 dark:border-purple-800 dark:bg-slate-900">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Pagos en curso</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-none">
                    {subscription!.payments.length}/{subscription!.installments} cuotas
                  </Badge>
                </div>
                <Progress
                  value={(subscription!.amountPaid / subscription!.totalAmount) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Pagado: {formatCurrency(subscription!.amountPaid)}</span>
                  <span>Restante: {formatCurrency(subscription!.totalAmount - subscription!.amountPaid)}</span>
                </div>

                {/* Payment History */}
                <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                  {subscription!.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Cuota {payment.paymentNumber}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleOpenAccessModal}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Pagar siguiente cuota
                </Button>
              </CardContent>
            </Card>
          )}

          {/* CTA Button */}
          {!hasPartialSubscription && (
            <Button
              onClick={handleOpenAccessModal}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Solicitar Acceso
            </Button>
          )}
        </div>

        {/* Access Modal */}
        <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                {hasPartialSubscription ? 'Pagar Cuota' : 'Acceder a Ingenio Millonario'}
              </DialogTitle>
            </DialogHeader>

            {hasPartialSubscription ? (
              /* Installment Payment View */
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total del programa</span>
                    <span className="font-medium dark:text-white">{formatCurrency(subscription!.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ya pagado</span>
                    <span className="font-medium text-green-600">{formatCurrency(subscription!.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t dark:border-purple-800">
                    <span className="dark:text-white">Restante</span>
                    <span className="text-purple-600">{formatCurrency(subscription!.totalAmount - subscription!.amountPaid)}</span>
                  </div>
                </div>

                {(() => {
                  const remaining = subscription!.totalAmount - subscription!.amountPaid;
                  const remainingInstallments = subscription!.installments - subscription!.payments.length;
                  const nextAmount = remainingInstallments === 1
                    ? remaining
                    : Math.ceil(remaining / remainingInstallments);
                  return (
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Próxima cuota</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(nextAmount)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cuota {subscription!.payments.length + 1} de {subscription!.installments}
                      </p>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Saldo de billetera</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(walletBalance)}</p>
                  </div>
                  <Wallet className="w-5 h-5 text-gray-400" />
                </div>

                <Button
                  onClick={handlePayInstallment}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Pagar Cuota
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* New Subscription View */
              <div className="space-y-4">
                {/* Program Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Programa completo incluye:</h3>
                  <ul className="space-y-1.5">
                    {(programInfo?.includes || [
                      'Todos los cursos de Educación Financiera',
                      'Módulo de Gestión de Ingresos y Egresos',
                      'Presupuestos de gastos y ganancias',
                      'Metodología 5S aplicada a finanzas',
                      'Matriz Financiera personalizada',
                      'Certificación al completar',
                    ]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price */}
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Precio del programa</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(700000)}</p>
                </div>

                {/* Installment Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Forma de pago</Label>
                  <div className="grid gap-2">
                    {[
                      { value: 1, label: 'Pago único', amount: 700000 },
                      { value: 2, label: '2 cuotas', amount: Math.ceil(700000 / 2) },
                      { value: 3, label: '3 cuotas', amount: Math.ceil(700000 / 3) },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedInstallments(option.value)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          selectedInstallments === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedInstallments === option.value
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300 dark:border-slate-600'
                          }`}>
                            {selectedInstallments === option.value && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-purple-600">
                          {formatCurrency(option.amount)}{option.value > 1 ? ' c/u' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Saldo de billetera</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(walletBalance)}</p>
                  </div>
                  <Wallet className="w-5 h-5 text-gray-400" />
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {selectedInstallments === 1 ? 'Total a pagar ahora' : `Primera cuota (1/${selectedInstallments})`}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(
                        selectedInstallments === 1
                          ? 700000
                          : Math.ceil(700000 / selectedInstallments)
                      )}
                    </span>
                  </div>
                  {selectedInstallments > 1 && (
                    <p className="text-xs text-gray-400">
                      Total del programa: {formatCurrency(700000)} en {selectedInstallments} cuotas
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando pago...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      {selectedInstallments === 1 ? 'Pagar y Acceder' : 'Pagar Primera Cuota'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ========== FULL ACCESS VIEW (existing dashboard) ==========
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

      const res = await fetch(`/api/finances/budget?month=${month}&year=${year}`, {
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

      const res = await fetch('/api/finances/budget', {
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
