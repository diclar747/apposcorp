import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Download, Loader2, Check, X } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getTransactionTypeInfo, getTransactionStatusInfo, generateReportPDF } from '@/lib/utils';
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
import { toast } from 'sonner';

const typeFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
  { value: 'transfer', label: 'Transferencias' },
  { value: 'purchase', label: 'Compras' },
  { value: 'sale', label: 'Ventas' },
];

export default function AdminTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          <div class="stat-label">TOTAL TRANSACCIONES</div>
          <div class="stat-value">${transactions.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">INGRESOS</div>
          <div class="text-green stat-value">${formatCurrency(transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
        <div class="stat">
          <div class="stat-label">EGRESOS</div>
          <div class="text-red stat-value">${formatCurrency(Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)))}</div>
        </div>
        <div class="stat">
          <div class="stat-label">PENDIENTES</div>
          <div class="stat-value">${transactions.filter(t => t.status === 'pending').length}</div>
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
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.includes(searchTerm);
    const matchesType = typeFilter === 'all' || transaction.type.includes(typeFilter);
    return matchesSearch && matchesType;
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
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Transacciones</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Egresos</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">
              {transactions.filter(t => t.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
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
            <div className="flex gap-2 flex-wrap">
              {typeFilters.map((type) => (
                <Button
                  key={type.value}
                  variant={typeFilter === type.value ? 'default' : 'outline'}
                  onClick={() => setTypeFilter(type.value)}
                  size="sm"
                >
                  {type.label}
                </Button>
              ))}
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
                      className="border-b border-gray-100 hover:bg-gray-50"
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
                        {transaction.status === 'pending' && transaction.type === 'deposit' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(transaction.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(transaction.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
