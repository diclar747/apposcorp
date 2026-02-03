import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle, Eye, Clock, FileText, DollarSign } from 'lucide-react';
import { mockCredits, mockUsers } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
];

export default function AdminCredits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCredits = mockCredits.filter(credit => {
    const user = mockUsers.find(u => u.id === credit.userId);
    const matchesSearch = user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      rejected: 'bg-red-100 text-red-700',
      defaulted: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      active: 'Activo',
      completed: 'Completado',
      rejected: 'Rechazado',
      defaulted: 'En mora',
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créditos</h1>
          <p className="text-gray-500">Gestiona las solicitudes de crédito</p>
        </div>
        <Button variant="outline">Exportar reporte</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-gray-900">{mockCredits.filter(c => c.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-gray-900">{mockCredits.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-gray-900">{mockCredits.filter(c => c.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockCredits.reduce((sum, c) => sum + c.amount, 0))}</p>
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
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((status) => (
                <Button
                  key={status.value}
                  variant={statusFilter === status.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status.value)}
                  size="sm"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredits.map((credit, index) => {
                  const user = mockUsers.find(u => u.id === credit.userId);
                  const paidInstallments = credit.payments.length;
                  const progress = (paidInstallments / credit.installments) * 100;
                  
                  return (
                    <motion.tr
                      key={credit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(credit.amount)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(credit.totalToPay)} total</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{credit.installments} cuotas de {formatCurrency(credit.installmentAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">{paidInstallments}/{credit.installments} pagadas</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(credit.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(credit.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalle del Crédito</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Cliente</p>
                                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Concepto</p>
                                  <p className="font-medium">{credit.concept}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Monto</p>
                                  <p className="font-medium">{formatCurrency(credit.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Interés</p>
                                  <p className="font-medium">{credit.interestRate}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Total a pagar</p>
                                  <p className="font-medium">{formatCurrency(credit.totalToPay)}</p>
                                </div>
                              </div>
                              
                              {/* Payment Schedule */}
                              <div>
                                <p className="text-sm text-gray-500 mb-2">Plan de Pagos</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {credit.paymentSchedule.map((installment) => (
                                    <div key={installment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                      <div>
                                        <p className="font-medium text-sm">Cuota {installment.installmentNumber}</p>
                                        <p className="text-xs text-gray-500">Vence: {formatDate(installment.dueDate)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">{formatCurrency(installment.amount)}</p>
                                        <Badge variant={installment.status === 'paid' ? 'default' : installment.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                                          {installment.status === 'paid' ? 'Pagada' : installment.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              {credit.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button className="flex-1 bg-green-600">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aprobar
                                  </Button>
                                  <Button variant="destructive" className="flex-1">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
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
