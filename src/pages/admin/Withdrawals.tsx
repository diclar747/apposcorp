import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle, Clock, DollarSign, Download, Loader2, Wallet } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getTransactionStatusInfo, cn, generateReportPDF } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminWithdrawals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const data = await walletApi.getAllTransactions();
      const onlyWithdrawals = data.filter((t: any) => t.type === 'withdrawal');
      setWithdrawals(onlyWithdrawals);
    } catch (error) {
      toast.error('Error al cargar solicitudes de retiro');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await walletApi.approveWithdrawal(id);
      toast.success('Retiro aprobado con éxito');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar retiro');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar este retiro? El monto será reembolsado al vendedor.')) return;
    try {
      await walletApi.rejectWithdrawal(id);
      toast.success('Retiro rechazado y reembolsado');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar retiro');
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const user = w.user;
    const matchesSearch = user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         w.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    const statsHtml = `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">PENDIENTES</div>
          <div class="stat-value">${withdrawals.filter(w => w.status === 'pending').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">COMPLETADOS</div>
          <div class="stat-value">${withdrawals.filter(w => w.status === 'completed').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">MONTO TOTAL</div>
          <div class="stat-value">${formatCurrency(Math.abs(withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0)))}</div>
        </div>
        <div class="stat">
          <div class="stat-label">TOTAL HISTÓRICO</div>
          <div class="stat-value">${withdrawals.length}</div>
        </div>
      </div>
    `;

    const rows = filteredWithdrawals.map(w => {
      const statusInfo = getTransactionStatusInfo(w.status);
      let statusClass = 'badge-gray';
      if (w.status === 'completed') statusClass = 'badge-green';
      if (w.status === 'pending') statusClass = 'badge-yellow';
      if (w.status === 'failed' || w.status === 'rejected') statusClass = 'badge-red';

      return `
        <tr>
          <td>${w.id.slice(-8).toUpperCase()}</td>
          <td>${w.user?.firstName || ''} ${w.user?.lastName || ''}</td>
          <td class="text-red font-bold">${formatCurrency(Math.abs(w.amount))}</td>
          <td><span class="badge ${statusClass}">${statusInfo.label}</span></td>
          <td>${formatDateTime(w.createdAt)}</td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vendedor</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    generateReportPDF('Reporte de Solicitudes de Retiro', statsHtml, tableHtml);
    toast.success('Reporte generado correctamente');
  };

  const stats = [
    { label: 'Pendientes', value: withdrawals.filter(w => w.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Completados', value: withdrawals.filter(w => w.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Monto Total', value: formatCurrency(Math.abs(withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0))), icon: DollarSign, color: 'text-blue-500' },
    { label: 'Total Histórico', value: withdrawals.length, icon: Wallet, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-2 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Retiros</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Gestión financiera de vendedores</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={isLoading} className="h-8 text-xs rounded-lg">
            {isLoading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="h-8 text-xs rounded-lg border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Download className="w-3.5 h-3.5 mr-2" />
            Reporte PDF
          </Button>
        </div>
      </div>

      {/* Stats Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="dark:bg-[#0f172a] dark:border-slate-800/50 border-slate-200 shadow-sm overflow-hidden relative group">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/10 shrink-0", stat.color.replace('text-', 'text-'))}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold text-slate-900 dark:text-white leading-none mb-0.5 truncate">{stat.value}</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none outline-none">{stat.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters Area */}
      <Card className="dark:bg-slate-900/50 dark:border-slate-800 border-slate-200 shadow-sm">
        <CardContent className="p-2">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar por vendedor o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-[11px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="h-8 text-[11px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-md">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3 h-3 text-slate-400" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-md">
                    <SelectItem value="all" className="text-[11px]">Todos los estados</SelectItem>
                    <SelectItem value="pending" className="text-[11px]">Pendientes</SelectItem>
                    <SelectItem value="completed" className="text-[11px]">Completados</SelectItem>
                    <SelectItem value="failed" className="text-[11px]">Fallidos/Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card className="dark:bg-slate-900/50 dark:border-slate-800 border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">ID</TableHead>
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Vendedor</TableHead>
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Monto</TableHead>
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none text-center">Estado</TableHead>
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none">Fecha</TableHead>
                  <TableHead className="py-2.5 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                      <p className="mt-2 text-xs text-slate-500">Cargando datos reales...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Filter className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No se encontraron solicitudes</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((withdrawal, index) => {
                    const user = withdrawal.user;
                    const statusInfo = getTransactionStatusInfo(withdrawal.status);
                    
                    return (
                      <motion.tr
                        key={withdrawal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="py-2 px-4">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{withdrawal.id.slice(-8)}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="font-bold text-[10px] text-blue-600">{user?.firstName?.charAt(0)}</div>}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{user?.firstName} {user?.lastName}</span>
                              <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{user?.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <span className="font-bold text-sm text-red-600 dark:text-red-400">{formatCurrency(Math.abs(withdrawal.amount))}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-center">
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-[9px] font-bold px-2 py-0 h-4`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4 leading-tight">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{formatDateTime(withdrawal.createdAt).split(' ')[0]}</span>
                            <span className="text-[9px] text-slate-500">{formatDateTime(withdrawal.createdAt).split(' ')[1]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(withdrawal.id)}
                                className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-bold"
                              >
                                Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(withdrawal.id)}
                                className="h-7 px-2 text-[10px] font-bold"
                              >
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
