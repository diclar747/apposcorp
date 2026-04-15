import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Plus, Search, Trash2, Edit2, MoreVertical, Receipt, Tag,
  Calendar, FileText, BarChart3, PieChart as PieChartIcon, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { managementApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6b7280'];

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export default function Gestion() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.sellerProfile && user.sellerProfile.plan) {
      const features = user.sellerProfile.plan.features || [];
      if (!features.some(f => f.toLowerCase().includes('gestión de caja'))) {
        toast.error('Tu plan no incluye gestión de caja');
        navigate('/vendedor');
      }
    }
  }, [user, navigate]);

  // ─── State ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form state
  const [movementForm, setMovementForm] = useState({
    type: 'income' as 'income' | 'expense',
    categoryId: '',
    amount: '',
    description: '',
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    color: '#3B82F6',
  });

  // ─── Data Fetching ──────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [summaryData, catsData, movsData] = await Promise.all([
        managementApi.getSummary(),
        managementApi.getCategories(),
        managementApi.getMovements({ limit: 100 }),
      ]);
      setSummary(summaryData);
      setCategories(catsData);
      setMovements(movsData.movements);
      setTotalMovements(movsData.total);
    } catch (error: any) {
      // If no categories, seed them first
      if (error.message?.includes('500') || categories.length === 0) {
        try {
          await managementApi.seedCategories();
          const [summaryData, catsData, movsData] = await Promise.all([
            managementApi.getSummary(),
            managementApi.getCategories(),
            managementApi.getMovements({ limit: 100 }),
          ]);
          setSummary(summaryData);
          setCategories(catsData);
          setMovements(movsData.movements);
          setTotalMovements(movsData.total);
        } catch {
          toast.error('Error al cargar datos de gestión');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Seed categories on first load, then fetch all
    const init = async () => {
      try {
        await managementApi.seedCategories();
      } catch { /* already seeded */ }
      fetchAll();
    };
    init();
  }, []);

  // ─── Filtered Movements ─────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (filterCategory !== 'all' && m.categoryId !== filterCategory) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return m.description.toLowerCase().includes(term) ||
          m.voucherNumber?.toLowerCase().includes(term) ||
          m.category?.name.toLowerCase().includes(term);
      }
      return true;
    });
  }, [movements, filterType, filterCategory, searchTerm]);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // ─── Handlers ───────────────────────────────────────
  const handleSaveMovement = async () => {
    if (!movementForm.categoryId || !movementForm.amount || !movementForm.description) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    try {
      await managementApi.createMovement(movementForm);
      toast.success('Movimiento registrado');
      setIsMovementDialogOpen(false);
      setMovementForm({
        type: 'income', categoryId: '', amount: '', description: '', voucherNumber: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchAll();
    } catch {
      toast.error('Error al registrar movimiento');
    }
  };

  const handleDeleteMovement = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      await managementApi.deleteMovement(id);
      toast.success('Movimiento eliminado');
      fetchAll();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) { toast.error('Nombre es obligatorio'); return; }
    try {
      if (editingCategory) {
        await managementApi.updateCategory(editingCategory.id, categoryForm);
      } else {
        await managementApi.createCategory(categoryForm);
      }
      toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', type: 'income', color: '#3B82F6' });
      fetchAll();
    } catch {
      toast.error('Error al guardar categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría y todos sus movimientos?')) return;
    try {
      await managementApi.deleteCategory(id);
      toast.success('Categoría eliminada');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  // ─── Pie Data ───────────────────────────────────────
  const incomePieData = useMemo(() => {
    return (summary?.categoryBreakdown || [])
      .filter((c: any) => c.type === 'income')
      .map((c: any) => ({ name: c.name, value: c.total, color: c.color }));
  }, [summary]);

  const expensePieData = useMemo(() => {
    return (summary?.categoryBreakdown || [])
      .filter((c: any) => c.type === 'expense')
      .map((c: any) => ({ name: c.name, value: c.total, color: c.color }));
  }, [summary]);

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Cargando gestión...</p>
        </div>
      </div>
    );
  }

  // ─── Variation helper ───────────────────────────────
  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const incomeChange = pctChange(summary?.monthIncome || 0, summary?.lastMonthIncome || 0);
  const expenseChange = pctChange(summary?.monthExpense || 0, summary?.lastMonthExpense || 0);

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            Gestión Financiera
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Control de ingresos, egresos y movimientos de tu negocio.</p>
        </div>
        <Button
          onClick={() => {
            setMovementForm({
              type: 'income', categoryId: '', amount: '', description: '', voucherNumber: '',
              date: new Date().toISOString().split('T')[0],
            });
            setIsMovementDialogOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Movimiento
        </Button>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Income */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                {incomeChange !== 0 && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-[10px]">
                    {incomeChange > 0 ? '+' : ''}{incomeChange}%
                  </Badge>
                )}
              </div>
              <p className="text-green-100 text-xs font-bold uppercase tracking-wider">Ingresos del Mes</p>
              <p className="text-xl sm:text-2xl font-black tracking-tighter mt-1">{formatCurrency(summary?.monthIncome || 0)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                {expenseChange !== 0 && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-[10px]">
                    {expenseChange > 0 ? '+' : ''}{expenseChange}%
                  </Badge>
                )}
              </div>
              <p className="text-red-100 text-xs font-bold uppercase tracking-wider">Egresos del Mes</p>
              <p className="text-xl sm:text-2xl font-black tracking-tighter mt-1">{formatCurrency(summary?.monthExpense || 0)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Balance del Mes</p>
              <p className="text-xl sm:text-2xl font-black tracking-tighter mt-1">{formatCurrency(summary?.monthBalance || 0)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">Balance General</p>
              <p className="text-xl sm:text-2xl font-black tracking-tighter mt-1">{formatCurrency(summary?.balance || 0)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ Charts Section ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Bar Chart — Income vs Expenses (last 6 months) */}
        <Card className="lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ingresos vs Egresos (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.monthlyData || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                  />
                  <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Egresos</span>
            </div>
          </CardContent>
        </Card>

        {/* Pie Charts — Category Breakdown */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Distribución del Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomePieData.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">Ingresos</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%" cy="50%"
                        innerRadius={30} outerRadius={55}
                        dataKey="value"
                        strokeWidth={2}
                      >
                        {incomePieData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {incomePieData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                      </span>
                      <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-xs">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Sin ingresos este mes
              </div>
            )}

            {expensePieData.length > 0 && (
              <div className="border-t pt-4 dark:border-slate-700">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">Egresos</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%" cy="50%"
                        innerRadius={30} outerRadius={55}
                        dataKey="value"
                        strokeWidth={2}
                      >
                        {expensePieData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {expensePieData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                      </span>
                      <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Main Content Tabs ═══ */}
      <Tabs defaultValue="movements" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid h-10">
          <TabsTrigger value="movements" className="gap-1.5 text-xs">
            <Receipt className="w-4 h-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs">
            <Tag className="w-4 h-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        {/* ── Movements Tab ── */}
        <TabsContent value="movements" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border dark:border-slate-800">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por descripción o comprobante..."
                className="pl-10 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
                <SelectItem value="expense">Egresos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                setMovementForm({
                  type: 'income', categoryId: '', amount: '', description: '', voucherNumber: '',
                  date: new Date().toISOString().split('T')[0],
                });
                setIsMovementDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 h-9 shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo
            </Button>
          </div>

          {/* Movements Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-10" />
                      <p className="font-medium">Sin movimientos registrados</p>
                      <p className="text-xs mt-1">Registra tu primer ingreso o egreso para comenzar</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => (
                    <TableRow key={m.id} className="group">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'text-[10px] font-bold uppercase border-0',
                          m.type === 'income'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        )}>
                          {m.type === 'income' ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.category?.color || '#6b7280' }} />
                          <span className="truncate max-w-[140px]">{m.category?.name || '-'}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                        {m.description}
                      </TableCell>
                      <TableCell>
                        {m.voucherNumber ? (
                          <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                            {m.voucherNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-bold text-sm',
                          m.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {m.type === 'income' ? '+' : '-'}{formatCurrency(m.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleDeleteMovement(m.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gestiona las categorías de ingresos y egresos de tu negocio.</p>
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', type: 'income', color: '#3B82F6' });
                setIsCategoryDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Categoría
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Categorías de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomeCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin categorías de ingreso</p>
                ) : (
                  incomeCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cat._count?.movements || 0} movimientos</p>
                        </div>
                        {cat.isSystem && <Badge variant="outline" className="text-[9px] h-4">Sistema</Badge>}
                      </div>
                      {!cat.isSystem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({ name: cat.name, type: cat.type, color: cat.color });
                              setIsCategoryDialogOpen(true);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(cat.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Categorías de Egresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenseCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin categorías de egreso</p>
                ) : (
                  expenseCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cat._count?.movements || 0} movimientos</p>
                        </div>
                        {cat.isSystem && <Badge variant="outline" className="text-[9px] h-4">Sistema</Badge>}
                      </div>
                      {!cat.isSystem && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({ name: cat.name, type: cat.type, color: cat.color });
                              setIsCategoryDialogOpen(true);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(cat.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ New Movement Dialog ═══ */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
            <DialogDescription>Ingresa los datos del movimiento financiero.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMovementForm(f => ({ ...f, type: 'income', categoryId: '' }))}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2',
                  movementForm.type === 'income'
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-muted bg-background text-muted-foreground hover:border-gray-300'
                )}
              >
                <ArrowUpRight className="w-4 h-4" />
                Ingreso
              </button>
              <button
                onClick={() => setMovementForm(f => ({ ...f, type: 'expense', categoryId: '' }))}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2',
                  movementForm.type === 'expense'
                    ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    : 'border-muted bg-background text-muted-foreground hover:border-gray-300'
                )}
              >
                <ArrowDownRight className="w-4 h-4" />
                Egreso
              </button>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Categoría *</Label>
              <Select value={movementForm.categoryId} onValueChange={(v) => setMovementForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === movementForm.type).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Monto *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-11 text-lg font-bold"
                  value={movementForm.amount}
                  onChange={(e) => setMovementForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Fecha</Label>
                <Input
                  type="date"
                  className="h-11"
                  value={movementForm.date}
                  onChange={(e) => setMovementForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Voucher */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">N. Comprobante</Label>
              <Input
                placeholder="Ej: FAC-001234"
                value={movementForm.voucherNumber}
                onChange={(e) => setMovementForm(f => ({ ...f, voucherNumber: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Descripción *</Label>
              <Input
                placeholder="Detalle del movimiento..."
                value={movementForm.description}
                onChange={(e) => setMovementForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveMovement}
              disabled={!movementForm.categoryId || !movementForm.amount || !movementForm.description}
              className={cn(
                'font-bold',
                movementForm.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
            >
              Registrar {movementForm.type === 'income' ? 'Ingreso' : 'Egreso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Category Dialog ═══ */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>Define una categoría para clasificar tus movimientos.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Ventas al por mayor"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={categoryForm.type} onValueChange={(v: any) => setCategoryForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {CHART_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCategoryForm(f => ({ ...f, color }))}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      categoryForm.color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name} className="bg-green-600 hover:bg-green-700">
              Guardar Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
