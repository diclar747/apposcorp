import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Download, Loader2, Check, X, Eye, MoreHorizontal } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { cn, formatCurrency, formatDateTime, getTransactionTypeInfo, getTransactionStatusInfo, generateReportPDF } from '@/lib/utils';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const filterCategories = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
  { value: 'transfer', label: 'Transferencias' },
  { value: 'purchase', label: 'Compras' },
  { value: 'sale', label: 'Ventas' },
  { value: 'deposit', label: 'Depósitos' },
  { value: 'withdrawal', label: 'Retiros' },
  { value: 'credit', label: 'Créditos' },
];

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const fetchTransactions = async () => {
    try {
      const data = await walletApi.getAllTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await walletApi.approveDeposit(id);
      toast.success('Depósito aprobado correctamente');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar depósito');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await walletApi.rejectDeposit(id);
      toast.success('Depósito rechazado');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar depósito');
    }
  };

  const exportToPDF = () => {
    const statsHtml = `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">TOTAL GENERAL</div>
          <div class="stat-value">${transactions.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label" style="color: #16a34a">INGRESOS (Aprobados)</div>
          <div class="text-green stat-value">${formatCurrency(transactions.filter(t => t.amount > 0 && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
        <div class="stat">
          <div class="stat-label" style="color: #dc2626">EGRESOS (Aprobados)</div>
          <div class="text-red stat-value">${formatCurrency(Math.abs(transactions.filter(t => t.amount < 0 && (t.status === 'completed' || t.status === 'pending')).reduce((sum, t) => sum + t.amount, 0)))}</div>
        </div>
        <div class="stat">
          <div class="stat-label" style="color: #d97706">GLOBAL PENDIENTES</div>
          <div class="text-amber stat-value">${transactions.filter(t => t.status === 'pending').length}</div>
        </div>
      </div>
      
      <div class="stats" style="margin-top: 10px;">
        <div class="stat">
          <div class="stat-label">DEPÓSITOS PENDIENTES</div>
          <div class="text-amber stat-value">${transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">DEPÓSITOS APROBADOS</div>
          <div class="text-green stat-value">${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">DEPÓSITOS RECHAZADOS</div>
          <div class="text-red stat-value">${transactions.filter(t => t.type === 'deposit' && (t.status === 'failed' || t.status === 'rejected')).length}</div>
        </div>
      </div>
    `;

    const rows = filteredTransactions.map(t => {
      const typeInfo = getTransactionTypeInfo(t.type);
      const statusInfo = getTransactionStatusInfo(t.status);
      let statusClass = 'badge-gray';
      if (t.status === 'completed') statusClass = 'badge-green';
      if (t.status === 'pending') statusClass = 'badge-yellow';
      if (t.status === 'failed' || t.status === 'rejected') statusClass = 'badge-red';

      return `
        <tr>
          <td>${formatDateTime(t.createdAt)}</td>
          <td>${typeInfo.label}</td>
          <td>${t.user?.firstName || ''} ${t.user?.lastName || ''}</td>
          <td>${t.description}</td>
          <td class="${t.amount > 0 ? 'text-green' : 'text-red'} font-bold">${formatCurrency(t.amount)}</td>
          <td><span class="badge ${statusClass}">${statusInfo.label}</span></td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Usuario</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    generateReportPDF('Reporte de Transacciones', statsHtml, tableHtml);
    toast.success('Reporte de transacciones generado');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const user = transaction.user;
    const matchesSearch = (transaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      transaction.id.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || 
      transaction.type.includes(categoryFilter) || 
      (categoryFilter === 'income' && transaction.amount > 0) ||
      (categoryFilter === 'expense' && transaction.amount < 0);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-500">Historial de todas las transacciones</p>
        </div>
        <Button variant="outline" onClick={exportToPDF}>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Transacciones</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Ingresos (Aprobados)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(transactions.filter(t => t.amount > 0 && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Egresos (Aprobados)</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.abs(transactions.filter(t => t.amount < 0 && (t.status === 'completed' || t.status === 'pending')).reduce((sum, t) => sum + t.amount, 0)))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Global Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">
              {transactions.filter(t => t.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Specific Counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-tighter text-amber-600 mb-0.5">Depósitos Pendientes</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-500">
            {transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}
          </p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-tighter text-green-600 mb-0.5">Depósitos Aprobados</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-500">
            {transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length}
          </p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-tighter text-red-600 mb-0.5">Depósitos Rechazados</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-500">
            {transactions.filter(t => t.type === 'deposit' && (t.status === 'failed' || t.status === 'rejected')).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar transacciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-800">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span>{filterCategories.find(c => c.value === categoryFilter)?.label || 'Filtros'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200 dark:border-slate-800">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categorías</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterCategories.map((category) => (
                    <DropdownMenuItem 
                      key={category.value}
                      onClick={() => setCategoryFilter(category.value)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer font-bold text-sm",
                        categoryFilter === category.value ? "bg-slate-100 dark:bg-slate-800 text-blue-600" : ""
                      )}
                    >
                      {category.label}
                      {categoryFilter === category.value && <Check className="ml-auto w-4 h-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => {
                  const user = transaction.user;
                  const typeInfo = getTransactionTypeInfo(transaction.type);

                  return (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <TableCell>
                        <span className="text-sm font-mono text-gray-500">{transaction.id.slice(0, 8)}...</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user?.avatar && <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />}
                          <span className="text-sm">{user ? `${user.firstName} ${user.lastName}` : 'Desconocido'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm capitalize ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{transaction.description}</span>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDateTime(transaction.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTransactionStatusInfo(transaction.status).bgColor} ${getTransactionStatusInfo(transaction.status).color} border-0`}>
                          {getTransactionStatusInfo(transaction.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200 dark:border-slate-800">
                            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-slate-400">Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {transaction.metadata?.receiptUrl && (
                              <DropdownMenuItem 
                                onClick={() => setSelectedTransaction(transaction)}
                                className="flex items-center gap-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20"
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span className="font-bold text-sm">Ver comprobante</span>
                              </DropdownMenuItem>
                            )}
                            
                            {transaction.status === 'pending' && transaction.type === 'deposit' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(transaction.id)}
                                  className="flex items-center gap-2 cursor-pointer focus:bg-green-50 dark:focus:bg-green-900/20"
                                >
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span className="font-bold text-sm">Aprobar Depósito</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleReject(transaction.id)}
                                  className="flex items-center gap-2 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                  <span className="font-bold text-sm">Rechazar Depósito</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[10px] font-mono text-slate-400 uppercase">
                              ID: {transaction.id.slice(0, 12)}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-y-auto max-h-[90vh] bg-white dark:bg-slate-950">
          <div className="p-6 sm:p-8 space-y-6">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Comprobante de Pago</DialogTitle>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Validación interna de depósito de {selectedTransaction?.user?.firstName} {selectedTransaction?.user?.lastName}
                  </p>
                </div>
                {selectedTransaction && (
                  <Badge className={`${getTransactionStatusInfo(selectedTransaction.status).bgColor} ${getTransactionStatusInfo(selectedTransaction.status).color} px-4 py-1.5 rounded-full border-0 font-bold text-[10px] uppercase tracking-widest w-fit`}>
                    {getTransactionStatusInfo(selectedTransaction.status).label}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="relative group w-full max-h-[50vh] bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800/50 flex justify-center items-center">
              {selectedTransaction?.metadata?.receiptUrl && (
                <img 
                  src={selectedTransaction.metadata.receiptUrl} 
                  alt="Comprobante" 
                  className="max-w-full max-h-[50vh] object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]" 
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Monto de la Operación</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{selectedTransaction && formatCurrency(selectedTransaction.amount)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Fecha y Hora</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{selectedTransaction && formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
              {selectedTransaction?.status === 'pending' && selectedTransaction?.type === 'deposit' ? (
                <>
                  <Button 
                    className="flex-1 h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest gap-2 shadow-lg shadow-green-500/20"
                    onClick={() => {
                      handleApprove(selectedTransaction.id);
                      setSelectedTransaction(null);
                    }}
                  >
                    <Check className="w-5 h-5" />
                    Aprobar Recarga
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl border-2 border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-black uppercase tracking-widest gap-2"
                    onClick={() => {
                      handleReject(selectedTransaction.id);
                      setSelectedTransaction(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                    Rechazar Recarga
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 font-black uppercase tracking-widest"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Cerrar Vista
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
