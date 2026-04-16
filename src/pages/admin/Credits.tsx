import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, Eye, Clock, FileText, DollarSign, Loader2
} from 'lucide-react';
import { creditsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
  defaulted: 'bg-red-100 text-red-700',
  cancelled: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  active: 'Activo',
  completed: 'Completado',
  rejected: 'Rechazado',
  defaulted: 'En mora',
  cancelled: 'Cancelado',
};

const docLabels: Record<string, string> = {
  id_front: 'Cédula - Frente',
  id_back: 'Cédula - Dorso',
  other: 'Documento',
};

export default function AdminCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const data = await creditsApi.getAllAdmin();
      setCredits(data);
    } catch {
      toast.error('Error al cargar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!credits.length) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Reporte de Créditos - Oscorp', 15, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 15, 28);

    const tableData = filteredCredits.map(c => [
      `${c.user?.firstName} ${c.user?.lastName}`,
      c.concept,
      formatCurrency(c.amount),
      `${c.payments?.length || 0}/${c.installments}`,
      statusLabels[c.status] || c.status,
      new Date(c.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Cliente', 'Concepto', 'Monto', 'Cuotas', 'Estado', 'Fecha']],
      body: tableData,
    });

    doc.save(`creditos-oscorp-${new Date().getTime()}.pdf`);
    toast.success('PDF exportado correctamente');
  };

  useEffect(() => { fetchCredits(); }, []);

  const filteredCredits = credits.filter(credit => {
    const name = `${credit.user?.firstName || ''} ${credit.user?.lastName || ''} ${credit.user?.email || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.approve(creditId);
      toast.success('Crédito aprobado - Monto acreditado a la billetera del cliente');
      setShowDetail(false);
      setSelectedCredit(null);
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar crédito');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.reject(creditId, rejectReason || undefined);
      toast.success('Crédito rechazado');
      setShowRejectDialog(false);
      setShowDetail(false);
      setSelectedCredit(null);
      setRejectReason('');
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar crédito');
    } finally {
      setActionLoading(null);
    }
  };

  const totalActive = credits.filter(c => c.status === 'active').reduce((s, c) => s + c.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créditos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona las solicitudes de crédito de clientes</p>
        </div>
        <Button variant="outline" onClick={exportToPDF}>
          Exportar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">{credits.filter(c => c.status === 'pending').length}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activos</p>
              <p className="text-2xl font-bold">{credits.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold">{credits.filter(c => c.status === 'completed').length}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto Activo</p>
              <p className="text-xl font-bold">{formatCurrency(totalActive)}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((sf) => (
              <Button key={sf.value} variant={statusFilter === sf.value ? 'default' : 'outline'} onClick={() => setStatusFilter(sf.value)} size="sm">
                {sf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Cuotas</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">No se encontraron créditos</TableCell></TableRow>
              ) : filteredCredits.map((credit, index) => {
                const paidInstallments = credit.payments?.length || 0;
                const progress = credit.installments > 0 ? (paidInstallments / credit.installments) * 100 : 0;
                return (
                  <motion.tr key={credit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={credit.user?.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{credit.user?.firstName?.[0]}{credit.user?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-sm">{credit.user?.firstName} {credit.user?.lastName}</span>
                          <p className="text-xs text-gray-500">{credit.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm max-w-[150px] truncate block">{credit.concept}</span></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{formatCurrency(credit.amount)}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(credit.totalToPay)} total</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-28">
                        <span className="text-xs text-gray-500">{paidInstallments}/{credit.installments}</span>
                        <Progress value={progress} className="h-1.5 mt-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {credit.documents?.length > 0 ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"><FileText className="w-3 h-3 mr-1" />{credit.documents.length}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-500">Sin docs</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge className={statusStyles[credit.status] || 'bg-gray-100'}>{statusLabels[credit.status] || credit.status}</Badge></TableCell>
                    <TableCell><span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(credit.createdAt)}</span></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedCredit(credit); setShowDetail(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={(open) => { if (!open) { setShowDetail(false); setSelectedCredit(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedCredit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Detalle del Crédito
                  <Badge className={statusStyles[selectedCredit.status] || 'bg-gray-100'}>{statusLabels[selectedCredit.status] || selectedCredit.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Client */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedCredit.user?.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">{selectedCredit.user?.firstName?.[0]}{selectedCredit.user?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedCredit.user?.firstName} {selectedCredit.user?.lastName}</p>
                    <p className="text-sm text-gray-500">{selectedCredit.user?.email}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div><p className="text-sm text-gray-500">Concepto</p><p className="font-medium">{selectedCredit.concept}</p></div>
                  <div><p className="text-sm text-gray-500">Monto</p><p className="font-bold text-lg">{formatCurrency(selectedCredit.amount)}</p></div>
                  <div><p className="text-sm text-gray-500">Total a pagar</p><p className="font-bold">{formatCurrency(selectedCredit.totalToPay)}</p></div>
                  <div><p className="text-sm text-gray-500">Cuotas</p><p className="font-medium">{selectedCredit.installments}x de {formatCurrency(selectedCredit.installmentAmount)}</p></div>
                  <div><p className="text-sm text-gray-500">Interés</p><p className="font-medium">{selectedCredit.interestRate}%</p></div>
                  <div><p className="text-sm text-gray-500">Fecha</p><p className="font-medium">{formatDate(selectedCredit.createdAt)}</p></div>
                </div>

                {/* Documents */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Documentos adjuntos</p>
                  {selectedCredit.documents?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCredit.documents.map((doc: any) => (
                        <div key={doc.id} className="space-y-1">
                          <p className="text-xs text-gray-500 font-medium">{docLabels[doc.type] || doc.type}</p>
                          <div className="cursor-pointer rounded-lg border overflow-hidden hover:shadow-md transition-shadow" onClick={() => setViewingImage(doc.url)}>
                            <img src={doc.url} alt={doc.type} className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <FileText className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-sm">Sin documentos adjuntos</p>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                {selectedCredit.paymentSchedule?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan de Pagos</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCredit.paymentSchedule.map((inst: any) => (
                        <div key={inst.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Cuota {inst.installmentNumber}</p>
                            <p className="text-xs text-gray-500">Vence: {formatDate(inst.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(inst.amount)}</p>
                            <Badge variant={inst.status === 'paid' ? 'default' : 'secondary'} className="text-xs">{inst.status === 'paid' ? 'Pagada' : 'Pendiente'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedCredit.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedCredit.id)} disabled={actionLoading === selectedCredit.id}>
                      {actionLoading === selectedCredit.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Aprobar crédito
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => setShowRejectDialog(true)} disabled={actionLoading === selectedCredit.id}>
                      <XCircle className="w-4 h-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) { setShowRejectDialog(false); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar Crédito</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo del rechazo (opcional)</Label>
              <Textarea placeholder="Explica el motivo del rechazo..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={() => selectedCredit && handleReject(selectedCredit.id)} disabled={actionLoading === selectedCredit?.id}>
              {actionLoading === selectedCredit?.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => { if (!open) setViewingImage(null); }}>
        <DialogContent className="max-w-3xl p-2">
          {viewingImage && <img src={viewingImage} alt="Documento" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
