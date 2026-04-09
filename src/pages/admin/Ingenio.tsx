import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, BookOpen, Trash2, Edit,
    ArrowLeft, Video, ChevronDown, ChevronUp, Sparkles,
    TrendingUp, TrendingDown, Landmark, GraduationCap,
    Wallet, Banknote, Coins, Download, FileText,
    ArrowUpRight, ArrowDownRight, Activity, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { formatCurrency, cn, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { coursesApi, financesApi, ingenioApi } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import Wheel from '@/components/ingenio/Wheel';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function exportToCSV(records: any[], type: string) {
    const headers = ['Fecha', 'Nombre / Descripción', 'Monto', 'Categoría'];
    const rows = records.map(r => [
        new Date(r.date || r.createdAt).toLocaleDateString('es-PY'),
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.amount,
        r.category?.name || 'Varios'
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}s_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF(records: any[], type: string, total: number) {
    const typeLabels: Record<string, string> = {
        income: 'Ingresos', expense: 'Egresos', asset: 'Activos', liability: 'Pasivos'
    };
    const typeColors: Record<string, string> = {
        income: '#059669', expense: '#e11d48', asset: '#2563eb', liability: '#64748b'
    };
    const rows = records.map(r => `
        <tr>
            <td>${new Date(r.date || r.createdAt).toLocaleDateString('es-PY')}</td>
            <td><strong>${r.description || '—'}</strong></td>
            <td style="text-align:right;font-weight:700;color:${typeColors[type]}">${formatCurrency(r.amount)}</td>
            <td><span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:11px">${r.category?.name || 'Varios'}</span></td>
        </tr>`).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Reporte de ${typeLabels[type]} – Ingenio Millonario</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #fff; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid ${typeColors[type]}; }
            .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
            .brand span { color: ${typeColors[type]}; }
            .meta { text-align: right; font-size: 12px; color: #64748b; }
            .title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
            .summary { display: flex; gap: 16px; margin-bottom: 28px; }
            .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; flex: 1; }
            .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
            .kpi-value { font-size: 20px; font-weight: 900; color: ${typeColors[type]}; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
            tr:hover td { background: #f8fafc; }
            .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
            @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
    </head><body>
        <div class="header">
            <div>
                <div class="brand">Ingenio <span>Millonario</span></div>
                <div style="font-size:13px;color:#64748b;margin-top:4px">Sistema de Gestión Financiera</div>
            </div>
            <div class="meta">
                <div class="title">Reporte de ${typeLabels[type]}</div>
                <div>Generado el ${new Date().toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
        </div>
        <div class="summary">
            <div class="kpi"><div class="kpi-label">Total Registros</div><div class="kpi-value">${records.length}</div></div>
            <div class="kpi"><div class="kpi-label">Monto Total</div><div class="kpi-value">${formatCurrency(total)}</div></div>
        </div>
        <table>
            <thead><tr><th>Fecha</th><th>Nombre / Descripción</th><th style="text-align:right">Monto</th><th>Categoría</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="footer">Ingenio Millonario · Reporte confidencial · ${new Date().getFullYear()}</div>
        <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`);
    win.document.close();
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function DashboardView({ onNavigate }: { onNavigate: (tab: string) => void }) {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        financesApi.getSummary()
            .then(setSummary)
            .catch(() => toast.error('Error al cargar resumen'))
            .finally(() => setLoading(false));
    }, []);

    const netWorth = (summary?.totalAssets || 0) - (summary?.totalLiabilities || 0);
    const balance = summary?.totalIncome - summary?.totalExpenses || 0;

    const kpis = [
        {
            label: 'Total Ingresos',
            value: summary?.totalIncome || 0,
            today: summary?.todayIncome || 0,
            icon: ArrowUpRight,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            border: 'border-l-emerald-500',
            trend: 'up',
        },
        {
            label: 'Total Egresos',
            value: summary?.totalExpenses || 0,
            today: summary?.todayExpenses || 0,
            icon: ArrowDownRight,
            color: 'text-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-500/10',
            border: 'border-l-rose-500',
            trend: 'down',
        },
        {
            label: 'Total Activos',
            value: summary?.totalAssets || 0,
            today: null,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            border: 'border-l-blue-500',
            trend: 'up',
        },
        {
            label: 'Total Pasivos',
            value: summary?.totalLiabilities || 0,
            today: null,
            icon: TrendingDown,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            border: 'border-l-amber-500',
            trend: 'down',
        },
    ];

    const chartData = [
        { name: 'Ingresos', value: summary?.totalIncome || 0, fill: '#059669' },
        { name: 'Egresos', value: summary?.totalExpenses || 0, fill: '#e11d48' },
        { name: 'Activos', value: summary?.totalAssets || 0, fill: '#2563eb' },
        { name: 'Pasivos', value: summary?.totalLiabilities || 0, fill: '#d97706' },
    ];

    const pieData = [
        { name: 'Activos', value: summary?.totalAssets || 0 },
        { name: 'Pasivos', value: summary?.totalLiabilities || 0 },
    ];
    const PIE_COLORS = ['#2563eb', '#e11d48'];

    const navButtons = [
        { id: 'budget', label: 'Presupuesto', icon: Coins, color: 'emerald' },
        { id: 'academy', label: 'Academia Online', icon: GraduationCap, color: 'blue' },
        { id: 'e1', label: 'Presentación E1', icon: Sparkles, color: 'violet' },
        { id: 'e2', label: 'Presentación E2', icon: Sparkles, color: 'amber' },
    ];

    const navColor: Record<string, string> = {
        emerald: 'from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/30',
        blue: 'from-blue-500 to-indigo-600 shadow-blue-200 dark:shadow-blue-900/30',
        violet: 'from-violet-500 to-purple-600 shadow-violet-200 dark:shadow-violet-900/30',
        amber: 'from-amber-500 to-orange-600 shadow-amber-200 dark:shadow-amber-900/30',
    };

    return (
        <div className="space-y-8">
            {/* Hero Balance */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Saldo de Caja</p>
                        {loading ? (
                            <div className="h-12 w-64 bg-slate-700 rounded-xl animate-pulse" />
                        ) : (
                            <p className="text-5xl font-black tracking-tight">{formatCurrency(summary?.balance || 0)}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                            <span className={`text-sm font-semibold flex items-center gap-1 ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                Flujo: {formatCurrency(Math.abs(balance))}
                            </span>
                            <span className="text-slate-500 text-xs">·</span>
                            <span className="text-slate-400 text-sm">Patrimonio Neto: <strong className={`${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(netWorth)}</strong></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-slate-300 font-medium">Sistema activo</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card className={cn("border-l-4 shadow-sm hover:shadow-md transition-shadow", kpi.border)}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={cn("p-2 rounded-xl", kpi.bg)}>
                                        <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                                    </div>
                                    {kpi.today !== null && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            Hoy: {formatCurrency(kpi.today)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                                {loading ? (
                                    <div className="h-7 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                ) : (
                                    <p className={cn("text-2xl font-black", kpi.color)}>{formatCurrency(kpi.value)}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">Resumen Financiero Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barSize={42}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} />
                                    <Tooltip
                                        formatter={(val: number) => [formatCurrency(val), '']}
                                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12, color: '#f8fafc', fontSize: 13 }}
                                        cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">Activos vs Pasivos</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-44 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value">
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#f8fafc', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Neto</span>
                                <span className={cn("text-sm font-black", netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatCurrency(netWorth)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                                    <span className="text-xs text-slate-500 font-medium">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Nav */}
            <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">Módulos</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {navButtons.map((btn, i) => (
                        <motion.button
                            key={btn.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.07 }}
                            onClick={() => onNavigate(btn.id)}
                            className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity", navColor[btn.color])} />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <btn.icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-white font-black text-sm uppercase tracking-tight leading-tight">{btn.label}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Academy Views ──────────────────────────────────────────────────────────────

function AcademyListView({ onSelectCourse, filter }: { onSelectCourse: (course: any) => void; filter?: string }) {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(false);

    const [formState, setFormState] = useState<any>({
        id: null,
        title: '',
        description: '',
        price: ''
    });

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await coursesApi.getAll(true);
            setCourses(data);
        } catch { toast.error('Error al cargar la academia'); }
        finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setFormState({ id: null, title: '', description: '', price: '' });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (course: any) => {
        setFormState({
            id: course.id,
            title: course.title.includes(':') ? course.title.split(':').slice(1).join(':').trim() : (course.title.includes(' - ') ? course.title.split(' - ').slice(1).join(' - ').trim() : course.title),
            description: course.description,
            price: course.price > 0 ? formatNumber(course.price) : ''
        });
        setIsFormOpen(true);
    };

    const handleSaveCourse = async () => {
        if (!formState.title) return toast.error('El título es obligatorio');
        try {
            const imCategory = filter === 'E1' ? 'IM E1' : filter === 'E2' ? 'IM E2' : 'Ingenio Millonario';
            const titleWithPrefix = filter ? `${filter} - ${formState.title}` : formState.title;
            
            const payload = {
                 title: titleWithPrefix,
                 description: formState.description,
                 category: imCategory,
                 price: parseFormattedNumber(formState.price)
            };

            if (formState.id) {
                await coursesApi.update(formState.id, payload);
                toast.success('Curso actualizado');
            } else {
                await coursesApi.create({ ...payload, isPublished: true });
                toast.success('Curso creado');
            }
            
            setIsFormOpen(false);
            fetchCourses();
        } catch { toast.error('Ocurrió un error al guardar el curso'); }
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setCourseToDelete(id);
    };

    const handleInitialize = async () => {
        try {
            setInitializing(true);
            await coursesApi.create({
                title: filter === 'E1' ? 'E1 - Fundamentos del Dinero' : 
                       filter === 'E2' ? 'E2 - Maestría Financiera' : 
                       'Curso de Ejemplo',
                description: filter === 'E1' 
                    ? 'Los 10 principios fundamentales para construir riqueza y libertad financiera.'
                    : 'Los 10 pasos avanzados que los millonarios usan para construir riqueza duradera.',
                shortDescription: filter === 'E1'
                    ? 'Descubre los fundamentos del dinero que nadie te enseñó.'
                    : 'Estrategias avanzadas de construcción de riqueza.',
                category: filter === 'E1' ? 'IM E1' : filter === 'E2' ? 'IM E2' : 'Ingenio Millonario',
                level: filter === 'E2' ? 'advanced' : 'beginner',
                price: 0,
                isPublished: true,
            });
            toast.success(`Curso ${filter || ''} creado correctamente`);
            fetchCourses();
        } catch (error: any) {
            console.error('Error creating course:', error);
            toast.error(error.message || 'Error al crear curso');
        } finally {
            setInitializing(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        try {
            setIsDeleting(true);
            await coursesApi.delete(courseToDelete);
            toast.success('Curso eliminado permanentemente');
            fetchCourses();
        } catch { toast.error('Error al eliminar curso'); }
        finally {
            setIsDeleting(false);
            setCourseToDelete(null);
        }
    };
    const filteredCourses = courses.filter((course: any) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (!filter) return matchesSearch;
        const imCategory = `IM ${filter.toUpperCase()}`;
        return matchesSearch && (course.category === imCategory || course.title.toUpperCase().includes(filter.toUpperCase()));
    });

    const wheelColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#14b8a6', '#8b5cf6', '#d946ef', '#f43f5e'];
    const wheelSegments = filteredCourses.length > 0 
        ? Array.from({ length: Math.max(12, filteredCourses.length) }).map((_, i) => {
            const course = filteredCourses[i % filteredCourses.length];
            // Format title to remove "E1 - " prefix if present for cleaner display on wheel
            const cleanTitle = course.title.replace(/^(E1|E2) - /i, '').trim();
            return {
                number: i + 1,
                color: wheelColors[i % wheelColors.length],
                title: cleanTitle,
            };
        }) 
        : [];

    return (
        <div className="space-y-6">
            {(filter === 'E1' || filter === 'E2') && filteredCourses.length > 0 && (
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-12 px-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 flex justify-center">
                        <Wheel segments={wheelSegments} size={440} />
                    </div>
                    <div className="w-full lg:w-96">
                        <Card className="rounded-3xl shadow-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <div className="bg-white dark:bg-slate-800 p-6 text-center border-b border-slate-100 dark:border-slate-700">
                                <h3 className="text-3xl font-light text-[#5CB85C] tracking-tight">Contenido</h3>
                            </div>
                            <CardContent className="p-4 max-h-[420px] overflow-y-auto">
                                <div className="space-y-2">
                                    {filteredCourses.map((course: any, i: number) => {
                                        const cleanTitle = course.title.replace(/^(E1|E2) - /i, '').trim();
                                        return (
                                            <div key={course.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-4 bg-white dark:bg-slate-900">
                                                <span className="font-medium text-slate-500 min-w-[20px]">{i + 1}.</span>
                                                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-tight">{cleanTitle}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {filter ? `Etapas ${filter}` : 'Etapas de Formación'}
                </h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Buscar etapa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-10 rounded-full w-64" />
                    </div>
                    <Button onClick={handleOpenCreate} className="rounded-full bg-blue-600 hover:bg-blue-700 h-10 px-6">
                        <Plus className="w-4 h-4 mr-2" /> Nuevo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400">
                         <div className="flex flex-col items-center gap-3">
                             <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                             <span>Cargando academia...</span>
                         </div>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 italic mb-4">No se encontraron etapas</p>
                        {filter && (
                            <Button 
                                onClick={handleInitialize} 
                                disabled={initializing}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                            >
                                {initializing ? 'Inicializando...' : (
                                    <><Sparkles className="w-4 h-4 mr-2" /> Inicializar Sistema {filter}</>
                                )}
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredCourses.map((course: any, i) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="relative group bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-center"
                            onClick={() => onSelectCourse(course)}
                        >
                            {/* Admin Actions Overlay */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity z-20">
                                <Button 
                                    variant="secondary" 
                                    size="icon" 
                                    className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 transition-all"
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(course); }}
                                    title="Editar curso"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="icon" 
                                    className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-110 transition-all"
                                    onClick={(e) => confirmDelete(e, course.id)}
                                    title="Eliminar curso"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-slate-900 rounded-full shadow-md border border-slate-50 dark:border-slate-800 flex items-center justify-center z-10">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <h3 className="font-black text-blue-600 dark:text-blue-400 text-lg uppercase tracking-tight leading-none line-clamp-1">{course.title.toUpperCase()}</h3>
                                <div className="h-0.5 w-12 bg-slate-100 dark:bg-slate-800 mx-auto" />
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-tight h-10 line-clamp-2">{course.description || 'Contenido educativo especializado'}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-3">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{course.modules?.length || 0} SECCIONES</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <Badge className={cn(
                                        "border-none text-[9px] font-bold px-2 py-0.5 rounded-full",
                                        course.isPublished ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {course.isPublished ? 'PÚBLICO' : 'BORRADOR'}
                                    </Badge>
                                </div>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                    {course.price > 0 ? formatCurrency(course.price) : 'GRATIS'}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="rounded-3xl sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter dark:text-white">
                            {formState.id ? 'Editar Etapa' : `Nueva Etapa ${filter}`}
                        </DialogTitle>
                        <DialogDescription className="dark:text-slate-400">
                            Completa los detalles de la etapa académica.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 dark:text-slate-300">Título</Label>
                            <Input placeholder="Nombre del curso..." value={formState.title} onChange={e => setFormState({ ...formState, title: e.target.value })} className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 dark:text-slate-300">Precio del Curso</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Gs.</span>
                                <Input 
                                    type="text" 
                                    placeholder="0" 
                                    value={formState.price} 
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        if (!raw) return setFormState({ ...formState, price: '' });
                                        const num = parseInt(raw, 10);
                                        setFormState({ ...formState, price: formatNumber(num) });
                                    }} 
                                    className="pl-10 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-slate-500 dark:text-slate-300">Descripción</Label>
                            <Textarea placeholder="Breve descripción..." value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} className="rounded-xl min-h-[100px] dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl dark:text-slate-300">Cancelar</Button>
                        <Button onClick={handleSaveCourse} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-8">
                            {formState.id ? 'Guardar Cambios' : 'Crear Etapa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-[2.5rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter dark:text-white">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            Esta acción eliminará permanentemente la etapa y todo su contenido asociado. No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-800 dark:text-slate-400">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteCourse}
                            disabled={isDeleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20"
                        >
                            {isDeleting ? 'Eliminando...' : 'Sí, eliminar etapa'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CourseDetailView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModuleOpen, setIsModuleOpen] = useState(false);
    const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
    const [isLessonOpen, setIsLessonOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '' });
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => { fetchCourse(); }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const data = await coursesApi.getById(courseId);
            setCourse(data);
        } catch { toast.error('Error al cargar detalle'); }
        finally { setLoading(false); }
    };

    if (loading || !course) return <div className="p-20 text-center text-slate-400">Cargando material...</div>;

    const toggleModule = (id: string) => setExpandedModules(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coursesApi.addModule(courseId, moduleForm);
            toast.success('Módulo creado');
            setIsModuleOpen(false);
            setModuleForm({ title: '', description: '' });
            fetchCourse();
        } catch { toast.error('Error al crear'); }
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coursesApi.addLesson(selectedModuleId, { title: lessonForm.title, videoUrl: lessonForm.videoUrl || null });
            toast.success('Material agregado');
            setIsLessonOpen(false);
            fetchCourse();
        } catch { toast.error('Error al agregar'); }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('¿Eliminar este material?')) return;
        try {
            await coursesApi.deleteLesson(lessonId);
            toast.success('Material eliminado');
            fetchCourse();
        } catch { toast.error('Error al eliminar'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            Gestionar: <span className="text-blue-600">{course.title}</span>
                        </h2>
                        <p className="text-sm text-slate-500">{course.modules?.length || 0} módulos cargados</p>
                    </div>
                </div>
                <Button onClick={() => setIsModuleOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Módulo
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {course.modules?.map((mod: any, idx: number) => {
                        const isExp = expandedModules.includes(mod.id);
                        return (
                            <Card key={mod.id} className="rounded-2xl border-slate-100 dark:bg-slate-900 overflow-hidden shadow-sm">
                                <div onClick={() => toggleModule(mod.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600">{idx + 1}</span>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{mod.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setSelectedModuleId(mod.id); setIsLessonOpen(true); }}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>
                                {isExp && (
                                    <div className="p-4 pt-0 space-y-2 border-t border-slate-50 dark:border-slate-800/30">
                                        {mod.lessons?.map((lsn: any) => (
                                            <div key={lsn.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Video className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{lsn.title}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeleteLesson(lsn.id); }} className="h-7 w-7 text-rose-500 hover:bg-rose-50">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {mod.lessons?.length === 0 && <p className="text-center py-4 text-xs text-slate-400 italic">No hay materiales en este módulo</p>}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
                <div>
                    <Card className="rounded-2xl p-6 border-slate-100 dark:bg-slate-900 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Estadísticas</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Estudiantes</p>
                                <p className="text-2xl font-black text-blue-700">{course.enrolledCount}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Estado</p>
                                <p className="text-lg font-black text-emerald-700">ACTIVO</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
                <DialogContent className="rounded-3xl">
                    <DialogTitle>Nuevo Módulo</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nombre del Módulo</Label>
                            <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} className="rounded-xl" />
                        </div>
                        <Button onClick={handleCreateModule as any} className="w-full rounded-xl bg-blue-600">Crear</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
                <DialogContent className="rounded-3xl">
                    <DialogTitle>Agregar Material</DialogTitle>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Video</Label>
                            <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className="rounded-xl" placeholder="YouTube URL..." />
                        </div>
                        <Button onClick={handleCreateLesson as any} className="w-full rounded-xl bg-blue-600">Agregar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Budget View ────────────────────────────────────────────────────────────────

// These must match the PostgreSQL FinancialType enum exactly
type RecordType = 'income' | 'expense' | 'asset' | 'liability';

const TYPE_CONFIG: Record<RecordType, { label: string; plural: string; color: string; gradient: string; light: string; text: string; dot: string }> = {
    income: {
        label: 'Ingreso', plural: 'Ingresos',
        color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-600',
        light: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
    expense: {
        label: 'Egreso', plural: 'Egresos',
        color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-600',
        light: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
    },
    asset: {
        label: 'Activo', plural: 'Activos',
        color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-600',
        light: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    liability: {
        label: 'Pasivo', plural: 'Pasivos',
        color: 'bg-slate-500', gradient: 'from-slate-500 to-slate-700',
        light: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-500',
    },
};

function BudgetView() {
    const [activeType, setActiveType] = useState<RecordType>('income');
    const [records, setRecords] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // 'description' maps directly to the DB field (FinancialRecord.description)
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', categoryId: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const cfg = TYPE_CONFIG[activeType];

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await financesApi.getAll();
            setRecords(data.filter((r: any) => r.type === activeType));
        } catch { toast.error('Error al cargar registros'); }
        finally { setLoading(false); }
    };

    const DEFAULT_CATEGORIES = [
        // income
        { name: 'Salario', type: 'income', color: '#059669', icon: 'wallet' },
        { name: 'Freelance / Honorarios', type: 'income', color: '#0891b2', icon: 'code' },
        { name: 'Inversiones', type: 'income', color: '#7c3aed', icon: 'trending-up' },
        { name: 'Alquiler cobrado', type: 'income', color: '#ea580c', icon: 'home' },
        { name: 'Comisiones', type: 'income', color: '#d97706', icon: 'percent' },
        { name: 'Bonificaciones', type: 'income', color: '#16a34a', icon: 'gift' },
        { name: 'Ventas', type: 'income', color: '#2563eb', icon: 'shopping-bag' },
        { name: 'Dividendos', type: 'income', color: '#9333ea', icon: 'bar-chart' },
        { name: 'Otros ingresos', type: 'income', color: '#64748b', icon: 'plus' },
        // expense
        { name: 'Alimentación', type: 'expense', color: '#dc2626', icon: 'utensils' },
        { name: 'Transporte', type: 'expense', color: '#2563eb', icon: 'car' },
        { name: 'Vivienda / Alquiler', type: 'expense', color: '#7c3aed', icon: 'home' },
        { name: 'Salud y Medicina', type: 'expense', color: '#16a34a', icon: 'heart' },
        { name: 'Educación', type: 'expense', color: '#0891b2', icon: 'book' },
        { name: 'Entretenimiento', type: 'expense', color: '#e11d48', icon: 'music' },
        { name: 'Servicios básicos', type: 'expense', color: '#d97706', icon: 'zap' },
        { name: 'Vestimenta', type: 'expense', color: '#ec4899', icon: 'shirt' },
        { name: 'Comunicaciones', type: 'expense', color: '#06b6d4', icon: 'phone' },
        { name: 'Seguros', type: 'expense', color: '#64748b', icon: 'shield' },
        { name: 'Cuotas / Deudas', type: 'expense', color: '#f97316', icon: 'credit-card' },
        { name: 'Supermercado', type: 'expense', color: '#84cc16', icon: 'shopping-cart' },
        { name: 'Restaurantes', type: 'expense', color: '#f59e0b', icon: 'coffee' },
        { name: 'Impuestos', type: 'expense', color: '#475569', icon: 'file-text' },
        { name: 'Otros gastos', type: 'expense', color: '#94a3b8', icon: 'more-horizontal' },
        // asset
        { name: 'Efectivo / Cuenta corriente', type: 'asset', color: '#059669', icon: 'banknote' },
        { name: 'Cuenta de ahorro', type: 'asset', color: '#10b981', icon: 'piggy-bank' },
        { name: 'Bienes raíces', type: 'asset', color: '#2563eb', icon: 'building' },
        { name: 'Vehículos', type: 'asset', color: '#7c3aed', icon: 'car' },
        { name: 'Inversiones / Acciones', type: 'asset', color: '#d97706', icon: 'trending-up' },
        { name: 'Criptomonedas', type: 'asset', color: '#f59e0b', icon: 'coins' },
        { name: 'Maquinaria / Equipo', type: 'asset', color: '#0891b2', icon: 'settings' },
        { name: 'Otros activos', type: 'asset', color: '#64748b', icon: 'package' },
        // liability
        { name: 'Préstamo bancario', type: 'liability', color: '#dc2626', icon: 'landmark' },
        { name: 'Tarjeta de crédito', type: 'liability', color: '#e11d48', icon: 'credit-card' },
        { name: 'Hipoteca / Financiamiento', type: 'liability', color: '#7c3aed', icon: 'home' },
        { name: 'Deuda personal', type: 'liability', color: '#ea580c', icon: 'users' },
        { name: 'Préstamo vehicular', type: 'liability', color: '#2563eb', icon: 'car' },
        { name: 'Impuestos pendientes', type: 'liability', color: '#475569', icon: 'file-text' },
        { name: 'Otros pasivos', type: 'liability', color: '#94a3b8', icon: 'minus-circle' },
    ];

    const fetchCategories = async () => {
        try {
            const data = await financesApi.getCategories();
            if (data.length === 0) {
                // Auto-seed default categories on first use
                toast.info('Cargando categorías predeterminadas...', { duration: 2000 });
                await Promise.all(DEFAULT_CATEGORIES.map(cat => financesApi.createCategory(cat)));
                const seeded = await financesApi.getCategories();
                setCategories(seeded);
            } else {
                setCategories(data);
            }
        } catch { }
    };

    useEffect(() => {
        fetchRecords();
    }, [activeType]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async () => {
        if (!form.description || !form.amount) return toast.error('Nombre y monto son obligatorios');
        try {
            const payload = {
                description: form.description,
                amount: parseFloat(form.amount),
                type: activeType,
                categoryId: form.categoryId || undefined,
                date: form.date,
            };
            if (isEditing && editingId) {
                await financesApi.update(editingId, payload);
                toast.success('Registro actualizado');
            } else {
                await financesApi.create(payload);
                toast.success('Registro creado');
            }
            resetForm();
            fetchRecords();
        } catch { toast.error('Error al guardar'); }
    };

    const handleEdit = (record: any) => {
        setForm({
            date: new Date(record.date || record.createdAt).toISOString().split('T')[0],
            description: record.description || '',
            amount: record.amount.toString(),
            categoryId: record.categoryId || ''
        });
        setIsEditing(true);
        setEditingId(record.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return;
        try {
            await financesApi.delete(id);
            toast.success('Registro eliminado');
            fetchRecords();
        } catch { toast.error('Error al eliminar'); }
    };

    const resetForm = () => {
        setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', categoryId: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const filteredRecords = records.filter(r =>
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const total = filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Type Selector */}
            <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(TYPE_CONFIG) as RecordType[]).map(type => {
                    const c = TYPE_CONFIG[type];
                    const isActive = activeType === type;
                    return (
                        <button
                            key={type}
                            onClick={() => { setActiveType(type); resetForm(); }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all",
                                isActive
                                    ? `bg-gradient-to-r ${c.gradient} text-white shadow-lg shadow-black/10 scale-105`
                                    : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            )}
                        >
                            <div className={cn("w-2 h-2 rounded-full", isActive ? 'bg-white' : c.dot)} />
                            {c.plural}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Form Card */}
                <div className="xl:col-span-1">
                    <Card className="shadow-sm overflow-hidden">
                        <div className={cn("h-1.5 bg-gradient-to-r", cfg.gradient)} />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">
                                {isEditing ? `Editando ${cfg.label}` : `Nuevo ${cfg.label}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</Label>
                                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Descripción</Label>
                                <Input placeholder={`Ej: Salario enero, Alquiler, Préstamo...`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto (₲)</Label>
                                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="rounded-xl h-10 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</Label>
                                <Select value={form.categoryId} onValueChange={val => setForm({ ...form, categoryId: val })}>
                                    <SelectTrigger className="rounded-xl h-10">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.filter(c => c.type === activeType).map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                        {categories.filter(c => c.type === activeType).length === 0 && (
                                            <SelectItem value="none" disabled>Cargando categorías...</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={handleSave} className={cn("flex-1 rounded-xl h-10 text-white font-bold bg-gradient-to-r", cfg.gradient)}>
                                    {isEditing ? 'Actualizar' : 'Guardar'}
                                </Button>
                                {isEditing && (
                                    <Button variant="outline" onClick={resetForm} className="rounded-xl h-10 px-4">Cancelar</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary mini card */}
                    <Card className={cn("mt-4 shadow-sm border-none", cfg.light)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Total {cfg.plural}</p>
                                <p className={cn("text-xl font-black", cfg.text)}>{formatCurrency(total)}</p>
                            </div>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cfg.color)}>
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Records Table */}
                <div className="xl:col-span-2">
                    <Card className="shadow-sm overflow-hidden">
                        <div className={cn("h-1.5 bg-gradient-to-r", cfg.gradient)} />
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-700 dark:text-slate-300">
                                        Listado de {cfg.plural}
                                    </CardTitle>
                                    <p className="text-xs text-slate-400 mt-0.5">{filteredRecords.length} registros encontrados</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="pl-8 h-9 rounded-full w-44 text-sm"
                                        />
                                    </div>
                                    {/* Export Buttons */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl gap-1.5 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => exportToCSV(filteredRecords, activeType)}
                                        title="Exportar a Excel (CSV)"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Excel
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 rounded-xl gap-1.5 text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50"
                                        onClick={() => exportToPDF(filteredRecords, activeType, total)}
                                        title="Exportar a PDF"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 pl-4">Fecha</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400" colSpan={2}>Nombre / Descripción</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Monto</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell">Categoría</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-right pr-4">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({ length: 5 }).map((_, j) => (
                                                        <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-16">
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3", cfg.light)}>
                                                        <FileText className={cn("w-6 h-6", cfg.text)} />
                                                    </div>
                                                    <p className="text-slate-400 font-medium text-sm">No hay {cfg.plural.toLowerCase()} registrados</p>
                                                    <p className="text-slate-300 text-xs mt-1">Usa el formulario para agregar un nuevo registro</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((r, i) => (
                                                <motion.tr
                                                    key={r.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                                >
                                                    <TableCell className="pl-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                                                        {new Date(r.date || r.createdAt).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-800 dark:text-white text-sm max-w-[220px] truncate" colSpan={2}>{r.description || '—'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={cn("text-sm font-black", cfg.text)}>{formatCurrency(r.amount)}</span>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider rounded-lg border-slate-200">
                                                            {r.category?.name || 'Varios'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="pr-4">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="h-8 w-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg">
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {filteredRecords.length > 0 && (
                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                                    <span className="text-xs text-slate-400 font-medium">{filteredRecords.length} registros</span>
                                    <span className={cn("text-sm font-black", cfg.text)}>Total: {formatCurrency(total)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminIngenio() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Ingenio <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Millonario</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
                        Gestión Integral de Finanzas · Academia · Estadísticas
                    </p>
                </div>
                {selectedCourseId && (
                    <Button variant="outline" onClick={() => setSelectedCourseId(null)} className="rounded-xl h-10 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Volver a Lista
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedCourseId(null); }} className="space-y-8">
                <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl h-auto shadow-sm inline-flex flex-wrap gap-1">
                    {[
                        { value: 'dashboard', label: 'Dashboard', icon: Activity },
                        { value: 'budget', label: 'Presupuesto', icon: Landmark },
                        { value: 'academy', label: 'Academia Online', icon: BookOpen },
                        { value: 'e1', label: 'Presentación E1', icon: Sparkles },
                        { value: 'e2', label: 'Presentación E2', icon: Sparkles },
                    ].map(tab => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="rounded-xl px-5 py-2 h-9 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-sm flex items-center gap-1.5"
                        >
                            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        <TabsContent value="dashboard" forceMount className={activeTab !== 'dashboard' ? 'hidden' : ''}>
                            <DashboardView onNavigate={setActiveTab} />
                        </TabsContent>
                        <TabsContent value="budget" forceMount className={activeTab !== 'budget' ? 'hidden' : ''}>
                            <BudgetView />
                        </TabsContent>
                        <TabsContent value="academy" forceMount className={activeTab !== 'academy' ? 'hidden' : ''}>
                            {selectedCourseId ? (
                                <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
                            ) : (
                                <AcademyListView onSelectCourse={c => setSelectedCourseId(c.id)} />
                            )}
                        </TabsContent>
                        <TabsContent value="e1" forceMount className={activeTab !== 'e1' ? 'hidden' : ''}>
                            {selectedCourseId ? (
                                <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
                            ) : (
                                <AcademyListView onSelectCourse={c => setSelectedCourseId(c.id)} filter="E1" />
                            )}
                        </TabsContent>
                        <TabsContent value="e2" forceMount className={activeTab !== 'e2' ? 'hidden' : ''}>
                            {selectedCourseId ? (
                                <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />
                            ) : (
                                <AcademyListView onSelectCourse={c => setSelectedCourseId(c.id)} filter="E2" />
                            )}
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
}
