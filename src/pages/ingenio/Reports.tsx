import { useState, useEffect } from 'react';
import {
  FileText, Search, Calendar, Download, Trash2, Pencil,
  ArrowUpRight, ArrowDownLeft, Wallet, Landmark
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { financesApi } from '@/lib/api';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { AccessDenied } from '@/components/ingenio/AccessDenied';
import { formatCurrency, formatShortDate, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const EDIT_TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  asset: 'Activo',
  liability: 'Pasivo',
};

const DEFAULT_RANGE_DAYS = 30;

const toISODate = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD (local)

// When the user has not chosen a date range we default to the last 30 days
// so the list is always populated without touching the calendar.
const defaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - DEFAULT_RANGE_DAYS);
  return { startDate: toISODate(start), endDate: toISODate(end) };
};

export default function IngenioReports() {
  const [records, setRecords] = useState<any[]>([]);
  const [budgetApplied, setBudgetApplied] = useState<any[]>([]);
  const [budgetRecords, setBudgetRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [usingDefaultRange, setUsingDefaultRange] = useState(true);
  const [activeTab, setActiveTab] = useState('movements');
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    query: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ type: 'income', amount: '', description: '', notes: '', date: '', categoryId: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    financesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Auto-load the report as soon as the page opens and whenever the tab changes,
  // so the user always sees their full history without having to pick a date range first.
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openEdit = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      type: record.type,
      amount: formatNumber(record.amount.toString()),
      description: record.description || '',
      notes: record.notes || '',
      date: new Date(record.date).toISOString().split('T')[0],
      categoryId: record.categoryId || ''
    });
  };

  const handleUpdate = async () => {
    if (!editingRecord) return;
    if (!editForm.description || !editForm.amount) {
      toast.error('Nombre y monto son obligatorios');
      return;
    }
    try {
      setSavingEdit(true);
      await financesApi.update(editingRecord.id, {
        type: editForm.type,
        amount: parseFormattedNumber(editForm.amount),
        description: editForm.description,
        notes: editForm.notes,
        date: editForm.date,
        categoryId: editForm.categoryId || undefined,
      });
      toast.success('Registro actualizado');
      setEditingRecord(null);
      fetchReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (activeTab === 'movements') {
        const hasExplicitRange = !!(filters.startDate && filters.endDate);
        const range = hasExplicitRange
          ? { startDate: filters.startDate, endDate: filters.endDate }
          : defaultRange();
        setUsingDefaultRange(!hasExplicitRange);

        const params: any = {
          type: filters.type === 'all' ? undefined : filters.type,
          startDate: range.startDate,
          endDate: range.endDate,
          query: filters.query || undefined
        };
        const now = new Date();
        const [data, items] = await Promise.all([
          financesApi.getAll(params),
          financesApi.getBudgetItems(now.getMonth() + 1, now.getFullYear()).catch(() => [])
        ]);
        setRecords(data);
        // Progress applied to budget goals is not a financial record, but the user
        // expects to see it in the same list. Surface it as read-only rows.
        setBudgetApplied(
          (items || [])
            .filter((it: any) => Number(it.actualAmount) > 0)
            .map((it: any) => ({
              id: `budget-${it.id}`,
              date: it.startDate,
              type: it.type,
              description: it.name,
              notes: it.description || 'Aplicado a presupuesto',
              amount: Number(it.actualAmount),
              isBudget: true,
            }))
        );
      } else {
        // Fetch budget items with filters
        const date = new Date();
        const data = await financesApi.getBudgetItems(date.getMonth() + 1, date.getFullYear(), {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          query: filters.query || undefined
        });
        setBudgetRecords(data);
      }
      setHasSearched(true);
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const { status } = useIngenioSubscription();

  if (status !== 'ACTIVE') {
    return <AccessDenied status={status} />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Date range is optional. No dates -> last 30 days. Only one end -> warn but still run.
    if ((filters.startDate && !filters.endDate) || (!filters.startDate && filters.endDate)) {
      toast.info('Completá "Desde" y "Hasta" para acotar. Por ahora muestro los últimos 30 días.');
    }
    fetchReports();
  };

  const clearDateFilter = () => {
    setFilters(f => ({ ...f, startDate: '', endDate: '' }));
    setTimeout(fetchReports, 0);
  };

  // Widest possible range: surfaces every movement, including ones older than the
  // 30-day default (which otherwise stay hidden yet keep counting in Saldo de Caja).
  const ALL_HISTORY_START = '2000-01-01';
  const ALL_HISTORY_END = '2100-12-31';
  const isViewingAllHistory =
    filters.startDate === ALL_HISTORY_START && filters.endDate === ALL_HISTORY_END;
  const showAllHistory = () => {
    setFilters(f => ({ ...f, startDate: ALL_HISTORY_START, endDate: ALL_HISTORY_END }));
    setTimeout(fetchReports, 0);
  };

  const handleDelete = async (id: string) => {
    try {
      await financesApi.delete(id);
      toast.success('Registro eliminado');
      fetchReports();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Ingreso';
      case 'expense': return 'Egreso';
      case 'asset': return 'Activo';
      case 'liability': return 'Pasivo';
      default: return type;
    }
  };

  const exportToExcel = () => {
    if (records.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const exportData = records.map(r => {
      const d = new Date(r.date);
      const formattedDate = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
      return {
        'Fecha': formattedDate,
        'Tipo': getTypeLabel(r.type),
        'Nombre de Registro': r.description,
        'Descripción': r.notes || '',
        'Monto': r.amount
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_Financiero");

    const max_width = exportData.reduce((w, r) => Math.max(w, r['Nombre de Registro'].length), 10);
    worksheet["!cols"] = [ { wch: 15 }, { wch: 12 }, { wch: max_width + 5 }, { wch: 30 }, { wch: 15 } ];

    XLSX.writeFile(workbook, `Reporte_Ingenio_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel generado correctamente');
  };

  const exportToPDF = () => {
    if (records.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(63, 81, 181); 
    doc.text('Ingenio Millonario - Reporte', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Rango: ${filters.startDate} al ${filters.endDate}`, 14, 33);
    
    const tableData = records.map(r => {
      const d = new Date(r.date);
      const formattedDate = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
      return [
        formattedDate,
        getTypeLabel(r.type),
        r.description,
        r.notes || '-',
        `Gs. ${r.amount.toLocaleString('es-PY')}`
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Tipo', 'Nombre de Registro', 'Descripción', 'Monto']],
      body: tableData,
      headStyles: { fillColor: [63, 81, 181], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 40 },
      theme: 'grid'
    });

    doc.save(`Reporte_Ingenio_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado correctamente');
  };

  const exportBudgetToExcel = () => {
    if (budgetRecords.length === 0) return;
    const exportData = budgetRecords.map(r => ({
      'Meta': r.name,
      'Descripción': r.description || '',
      'Monto Objetivo': r.amount,
      'Progreso Actual': r.actualAmount,
      'Porcentaje': ((r.actualAmount / r.amount) * 100).toFixed(1) + '%',
      'Duración': `${r.durationMonths} meses`
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte_Presupuestos");
    XLSX.writeFile(workbook, `Reporte_Presupuestos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportBudgetToPDF = () => {
      if (budgetRecords.length === 0) return;
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(63, 81, 181); 
      doc.text('Reporte de Presupuesto y Metas', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

      const tableData = budgetRecords.map(r => [
          r.name,
          r.description || '-',
          `Gs. ${r.amount.toLocaleString('es-PY')}`,
          `Gs. ${r.actualAmount.toLocaleString('es-PY')}`,
          `${((r.actualAmount / r.amount) * 100).toFixed(0)}%`
      ]);

      autoTable(doc, {
          startY: 35,
          head: [['Meta', 'Descripción', 'Objetivo', 'Actual', '%']],
          body: tableData,
          headStyles: { fillColor: [63, 81, 181] },
          styles: { fontSize: 8 }
      });

      doc.save(`Reporte_Presupuestos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Financial records (editable) + budget-goal progress (read-only), newest first.
  const matchesQuery = (row: any) =>
    !filters.query ||
    (row.description || '').toLowerCase().includes(filters.query.toLowerCase()) ||
    (row.notes || '').toLowerCase().includes(filters.query.toLowerCase());

  const combinedRows = [
    ...records.map((r: any) => ({ ...r, isBudget: false })),
    ...budgetApplied.filter(
      (b: any) => (filters.type === 'all' || b.type === filters.type) && matchesQuery(b)
    ),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = combinedRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = combinedRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
               <FileText className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reportes Ingenio</h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">Exportación profesional de estados financieros</p>
        </div>
        
        {hasSearched && (activeTab === 'movements' ? records.length > 0 : budgetRecords.length > 0) && (
          <div className="flex gap-3">
             <Button 
               onClick={activeTab === 'movements' ? exportToExcel : exportBudgetToExcel} 
               className="rounded-xl border-2 font-bold gap-2 h-11 bg-white border-green-200 text-green-700 hover:bg-green-50 shadow-sm transition-all hover:scale-105 active:scale-95"
             >
               <Download className="w-4 h-4" /> Excel
             </Button>
             <Button 
               onClick={activeTab === 'movements' ? exportToPDF : exportBudgetToPDF} 
               className="rounded-xl border-2 font-bold gap-2 h-11 bg-white border-rose-200 text-rose-700 hover:bg-rose-50 shadow-sm transition-all hover:scale-105 active:scale-95"
             >
               <FileText className="w-4 h-4" /> PDF
             </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        setHasSearched(false);
      }} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl h-auto mb-8 grid grid-cols-2 max-w-md">
           <TabsTrigger value="movements" className="rounded-xl px-6 py-2.5 font-black text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md">
             Movimientos de Patrimonio
           </TabsTrigger>
           <TabsTrigger value="budgets" className="rounded-xl px-6 py-2.5 font-black text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md">
             Presupuesto y Metas
           </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border-t-4 border-indigo-600">
            <CardContent className="p-8">
               {/* Filters form stays here but adjusted */}
               <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Tipo Mov.</label>
              <Select value={filters.type} onValueChange={(val) => setFilters({...filters, type: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Egresos</SelectItem>
                  <SelectItem value="asset">Activos</SelectItem>
                  <SelectItem value="liability">Pasivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Desde</label>
              <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 <Input 
                   type="date" 
                   value={filters.startDate}
                   onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                   className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Hasta</label>
              <div className="relative">
                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 <Input 
                   type="date" 
                   value={filters.endDate}
                   onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                   className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Búsqueda</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 <Input 
                   placeholder="Nombre..."
                   value={filters.query}
                   onChange={(e) => setFilters({...filters, query: e.target.value})}
                   className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                 />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
              <Search className="w-5 h-5" /> {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-2">
        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-none font-black rounded-full px-3 h-7">
          {usingDefaultRange
            ? 'Últimos 30 días'
            : isViewingAllHistory
              ? 'Todo el historial'
              : `${filters.startDate} → ${filters.endDate}`}
        </Badge>
        <span className="text-sm font-bold text-slate-500">Ingresos <span className="text-emerald-500 font-black">{formatCurrency(totalIncome)}</span></span>
        <span className="text-sm font-bold text-slate-500">Egresos <span className="text-rose-500 font-black">{formatCurrency(totalExpense)}</span></span>
        <span className="text-sm font-bold text-slate-500">Neto <span className={cn("font-black", totalIncome - totalExpense >= 0 ? "text-emerald-500" : "text-rose-500")}>{formatCurrency(totalIncome - totalExpense)}</span></span>
        {!usingDefaultRange && (
          <Button type="button" variant="ghost" onClick={clearDateFilter} className="h-7 px-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
            Ver últimos 30 días
          </Button>
        )}
        {!isViewingAllHistory && (
          <Button type="button" variant="ghost" onClick={showAllHistory} className="h-7 px-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
            Ver todo el historial
          </Button>
        )}
      </div>
      {(
        <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50 border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Fecha</TableHead>
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Tipo</TableHead>
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Nomb. de Registro</TableHead>
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Descripción</TableHead>
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Monto</TableHead>
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && combinedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando movimientos...</TableCell>
                  </TableRow>
                )}
                {combinedRows.map((r) => (
                  <TableRow key={r.id} className="border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                    <TableCell className="py-6 px-8 font-bold text-slate-500">
                      {(() => {
                        const d = new Date(r.date);
                        return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
                      })()}
                    </TableCell>
                    <TableCell className="py-6 px-8">
                        <div className="flex flex-col gap-1">
                          <Badge className={cn(
                            "font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full border-none w-fit",
                            r.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' :
                            r.type === 'expense' ? 'bg-rose-500/10 text-rose-500' :
                            r.type === 'asset' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                          )}>
                            {getTypeLabel(r.type)}
                          </Badge>
                          {r.isBudget && (
                            <Badge className="font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full border-none w-fit bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Presupuesto
                            </Badge>
                          )}
                        </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                       <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.description}</span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-slate-500 font-medium">{r.notes || '-'}</TableCell>
                    <TableCell className="py-6 px-8 text-right font-black text-lg tracking-tighter">
                       <span className={cn(
                         r.type === 'income' || r.type === 'asset' ? 'text-emerald-500' : 'text-rose-500'
                       )}>
                         {r.type === 'income' || r.type === 'asset' ? '+' : '-'} {formatCurrency(r.amount)}
                       </span>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-center">
                      {r.isBudget ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">En Presupuesto</span>
                      ) : (
                      <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(r)}
                        className="transition-all text-slate-300 hover:text-indigo-600 rounded-full hover:bg-indigo-50"
                      >
                        <Pencil className="w-5 h-5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="transition-all text-slate-300 hover:text-rose-500 rounded-full hover:bg-rose-50">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black">¿Eliminar registro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium text-base">
                              Esta acción es irreversible. Se eliminará "{r.description}" de tu historial.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-2xl h-12 border-slate-100 font-bold">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(r.id)}
                              className="rounded-2xl h-12 bg-rose-500 hover:bg-rose-600 font-black px-6"
                            >
                              Confirmar Eliminación
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {combinedRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                       <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Sin resultados</h3>
                       <p className="text-sm text-slate-400 mt-1">No se encontraron movimientos para el filtro seleccionado.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
</TabsContent>

        <TabsContent value="budgets" className="space-y-8">
          <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border-t-4 border-emerald-500">
             <CardContent className="p-8">
               <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Desde</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input 
                      type="date" 
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Hasta</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input 
                      type="date" 
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Búsqueda</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input 
                      placeholder="Nombre o descripción..."
                      value={filters.query}
                      onChange={(e) => setFilters({...filters, query: e.target.value})}
                      className="h-12 pl-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg gap-2 shadow-lg shadow-emerald-200 dark:shadow-none">
                  <Search className="w-5 h-5" /> {loading ? 'Cargando...' : 'Generar Reporte'}
                </Button>
               </form>
             </CardContent>
          </Card>

          {!hasSearched ? (
            <Card className="border-none shadow-md bg-white/50 dark:bg-slate-900/30 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-100 dark:shadow-none">
                 <Calendar className="w-10 h-10 text-emerald-600" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Análisis de Metas</h2>
               <p className="text-slate-500 font-medium max-w-sm mx-auto">Selecciona el rango de fechas para visualizar el estado de tus objetivos presupuestarios.</p>
            </Card>
          ) : (
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
               <div className="overflow-x-auto">
                 <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                         <TableHead className="py-6 px-8 font-black text-[10px] uppercase text-slate-400">Meta</TableHead>
                         <TableHead className="py-6 px-8 font-black text-[10px] uppercase text-slate-400 text-right">Objetivo</TableHead>
                         <TableHead className="py-6 px-8 font-black text-[10px] uppercase text-slate-400 text-right">Actual</TableHead>
                         <TableHead className="py-6 px-8 font-black text-[10px] uppercase text-slate-400">Progreso</TableHead>
                         <TableHead className="py-6 px-8 font-black text-[10px] uppercase text-slate-400">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {budgetRecords.map(r => {
                          const progress = (r.actualAmount / r.amount) * 100;
                          const endDate = new Date(new Date(r.startDate).setMonth(new Date(r.startDate).getMonth() + r.durationMonths));
                          const isExpired = new Date() > endDate;
                          return (
                            <TableRow key={r.id}>
                               <TableCell className="py-6 px-8">
                                 <p className="font-black text-slate-900 dark:text-white uppercase">{r.name}</p>
                                 <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{r.description || 'Sin descripción'}</p>
                               </TableCell>
                               <TableCell className="py-6 px-8 text-right font-bold">{formatCurrency(r.amount)}</TableCell>
                               <TableCell className="py-6 px-8 text-right font-bold text-indigo-600">{formatCurrency(r.actualAmount)}</TableCell>
                               <TableCell className="py-6 px-8 w-48">
                                 <div className="space-y-1">
                                   <Progress value={Math.min(progress, 100)} className="h-1.5" />
                                   <p className="text-[10px] font-bold text-slate-400">{progress.toFixed(0)}% completo</p>
                                 </div>
                               </TableCell>
                               <TableCell className="py-6 px-8">
                                  <Badge className={cn(
                                    "rounded-full font-black text-[9px] uppercase tracking-widest",
                                    isExpired ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                  )}>
                                    {isExpired ? 'Finalizado' : 'En Curso'}
                                  </Badge>
                               </TableCell>
                            </TableRow>
                          );
                       })}
                       {budgetRecords.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Sin metas encontradas</TableCell>
                          </TableRow>
                       )}
                    </TableBody>
                 </Table>
               </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Editar registro</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Corregí el tipo, monto u otros datos de este movimiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</Label>
              <Select value={editForm.type} onValueChange={(val) => setEditForm({ ...editForm, type: val, categoryId: '' })}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EDIT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Descripción</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto (₲)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: formatNumber(e.target.value) })}
                className="rounded-xl h-11 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</Label>
              <Select value={editForm.categoryId} onValueChange={(val) => setEditForm({ ...editForm, categoryId: val })}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === editForm.type).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</Label>
              <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="rounded-xl h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingRecord(null)} className="rounded-xl h-11">Cancelar</Button>
            <Button onClick={handleUpdate} disabled={savingEdit} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold">
              {savingEdit ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
