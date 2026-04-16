import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle, Clock, DollarSign, Download } from 'lucide-react';
import { mockTransactions, mockUsers } from '@/data/mockData';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminWithdrawals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  const withdrawals = mockTransactions.filter(t => t.type === 'withdrawal');
  
  const filteredWithdrawals = withdrawals.filter(w => {
    const user = mockUsers.find(u => u.id === w.userId);
    const matchesSearch = user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo/Header
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('OSCORP PLATFORM', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE RETIROS', 15, 33);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PY')}`, pageWidth - 50, 25);

    const tableData = filteredWithdrawals.map(w => {
      const user = mockUsers.find(u => u.id === w.userId);
      return [
        w.id,
        `${user?.firstName || ''} ${user?.lastName || ''}`,
        formatCurrency(Math.abs(w.amount)),
        w.status === 'completed' ? 'Completado' : w.status === 'pending' ? 'Pendiente' : 'Rechazado',
        formatDateTime(w.createdAt)
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Vendedor', 'Monto', 'Estado', 'Fecha']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`retiros-oscorp-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Retiro</h1>
          <p className="text-gray-500">Gestiona las solicitudes de retiro de vendedores</p>
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
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{withdrawals.filter(w => w.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-green-600">{withdrawals.filter(w => w.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(Math.abs(withdrawals.reduce((sum, w) => sum + w.amount, 0)))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Este Mes</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(12500000)}</p>
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
                placeholder="Buscar por vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')} size="sm">Todos</Button>
              <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')} size="sm">Pendientes</Button>
              <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => setStatusFilter('completed')} size="sm">Completados</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal, index) => {
                  const user = mockUsers.find(u => u.id === withdrawal.userId);
                  
                  return (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell>
                        <span className="text-sm font-mono text-gray-500">{withdrawal.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-red-600">{formatCurrency(Math.abs(withdrawal.amount))}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'pending' ? 'secondary' : 'destructive'}>
                          {withdrawal.status === 'completed' ? 'Completado' : withdrawal.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDateTime(withdrawal.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" className="bg-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
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
