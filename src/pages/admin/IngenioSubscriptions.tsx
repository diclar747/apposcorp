import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Wallet, 
  Landmark, 
  User, 
  MoreHorizontal, 
  RefreshCw,
  Trash2,
  Ban,
  Eye,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ingenioApi } from '@/lib/api';
import { formatCurrency, cn, getSubscriptionStatusInfo } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import type { IngenioSubscription } from '@/types';
import { getSafeDate, formatDate } from '@/lib/utils';

export default function IngenioSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Approval Modal States
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await ingenioApi.getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSub) return;
    
    const rawAmount = typeof amountPaid === 'string' ? parseInt(amountPaid.replace(/\D/g, '') || '0', 10) : (amountPaid || 0);
    const remainingDebt = selectedSub.totalAmount - selectedSub.paidAmount;

    if (rawAmount <= 0 && selectedSub.paymentMethod !== 'WALLET') {
      toast.error('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (rawAmount > remainingDebt) {
      toast.error(`El monto supera la deuda pendiente de ${formatCurrency(remainingDebt)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await ingenioApi.approveSubscription(selectedSub.id, rawAmount);
      toast.success('Suscripción aprobada exitosamente');
      setApproveDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await ingenioApi.revokeSubscription(id);
      toast.success('Acceso revocado');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || 'Error al revocar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ingenioApi.deleteSubscription(id);
      toast.success('Suscripción eliminada');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };
function generatePDF(title: string, statsHtml: string, tableHtml: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#333;font-size:12px}
      h1{font-size:20px;margin-bottom:4px}
      .date{color:#666;font-size:11px;margin-bottom:16px}
      .stats{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
      .stat{background:#f5f5f5;padding:10px 14px;border-radius:8px;min-width:120px}
      .stat-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
      .stat-value{font-size:18px;font-weight:900;color:#1e293b}
      .stat.pending .stat-value{color:#d97706}
      .stat.active .stat-value{color:#16a34a}
      .stat.collected .stat-value{color:#4f46e5}
      .stat.debt .stat-value{color:#64748b}
      table{width:100%;border-collapse:collapse;font-size:10px;margin-top:20px;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
      th{background:#f8fafc;padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#64748b;text-transform:uppercase;font-size:9px;letter-spacing:0.5px}
      td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155}
      tr:nth-child(even){background:#f8fafc}
      .text-right{text-align:right}
      .badge{padding:2px 6px;border-radius:4px;font-size:8px;font-weight:bold;text-transform:uppercase}
      .badge-pending{background:#fef3c7;color:#92400e}
      .badge-active{background:#dcfce7;color:#166534}
      .badge-revoked{background:#fee2e2;color:#991b1b}
      @media print{body{padding:0}.no-print{display:none}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div>
        <h1 style="margin:0;color:#1e293b">Reporte de Suscripciones Ingenio</h1>
        <p style="margin:4px 0 0;color:#64748b;font-size:11px">Control de accesos y gestión de cobros - OSCORP</p>
      </div>
      <div style="text-align:right">
        <p class="date" style="margin:0">Generado: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}</p>
      </div>
    </div>
    ${statsHtml}
    <div style="margin-top:30px">
      <h2 style="font-size:14px;font-weight:900;color:#1e293b;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">Detalle de Suscriptores</h2>
      ${tableHtml}
    </div>
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

  const exportToPDF = () => {
    const totalPending = subscriptions.filter(s => s.status === 'PENDING_APPROVAL').length;
    const totalActive = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const totalCollected = subscriptions.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalToCollect = subscriptions.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

    const statsHtml = `<div class="stats">
      <div class="stat pending"><div class="stat-label">Pendientes</div><div class="stat-value">${totalPending}</div></div>
      <div class="stat active"><div class="stat-label">Activas</div><div class="stat-value">${totalActive}</div></div>
      <div class="stat collected"><div class="stat-label">Recaudado</div><div class="stat-value">${formatCurrency(totalCollected)}</div></div>
      <div class="stat debt"><div class="stat-label">Por Cobrar</div><div class="stat-value">${formatCurrency(totalToCollect)}</div></div>
    </div>`;
    
    const rows = filtered.map(s => {
      const statusInfo = getSubscriptionStatusInfo(s.status);
      const badgeClass = s.status === 'PENDING_APPROVAL' ? 'badge-pending' : 
                        s.status === 'ACTIVE' ? 'badge-active' : 'badge-revoked';
      
      return `<tr>
        <td style="font-weight:bold">${s.user?.firstName || ''} ${s.user?.lastName || 'Usuario'}</td>
        <td><span class="badge ${badgeClass}">${statusInfo.label}</span></td>
        <td>${s.installments} cuotas</td>
        <td class="text-right" style="font-weight:bold;color:#16a34a">${formatCurrency(s.paidAmount)}</td>
        <td class="text-right" style="font-weight:bold">${formatCurrency(s.totalAmount)}</td>
        <td>${formatDate(getSafeDate(s.updatedAt || s.createdAt))}</td>
      </tr>`;
    }).join('');
    
    const tableHtml = `<table>
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Estado</th>
          <th>Plan</th>
          <th class="text-right">Pagado</th>
          <th class="text-right">Total</th>
          <th>Último Mov.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
    
    generatePDF('Reporte de Suscripciones', statsHtml, tableHtml);
    toast.success('PDF exportado correctamente');
  };

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = filterStatus === 'all' || sub.status === filterStatus;

    if (filterStatus === 'WITH_DEBT') {
      matchesFilter = sub.paidAmount < sub.totalAmount;
    } else if (filterStatus === 'PAID_FULL') {
      matchesFilter = sub.paidAmount >= sub.totalAmount && sub.totalAmount > 0;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Suscripciones Ingenio
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Control de pagos y accesos al módulo Ingenio Millonario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF} size="sm">
            Exportar PDF
          </Button>
          <Button onClick={fetchSubscriptions} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pendientes</p>
            <p className="text-2xl font-black text-amber-600">
              {subscriptions.filter(s => s.status === 'PENDING_APPROVAL').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Activas</p>
            <p className="text-2xl font-black text-green-600">
              {subscriptions.filter(s => s.status === 'ACTIVE').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recaudado</p>
            <p className="text-2xl font-black text-indigo-600">
              {formatCurrency(subscriptions.reduce((acc, curr) => acc + curr.paidAmount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Por Cobrar</p>
            <p className="text-2xl font-black text-slate-500">
              {formatCurrency(subscriptions.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === 'all' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button 
              variant={filterStatus === 'PENDING_APPROVAL' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('PENDING_APPROVAL')}
            >
              Pendientes
            </Button>
            <Button 
              variant={filterStatus === 'ACTIVE' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('ACTIVE')}
            >
              Activos
            </Button>
            <Button 
              variant={filterStatus === 'WITH_DEBT' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('WITH_DEBT')}
            >
              Con saldo
            </Button>
            <Button 
              variant={filterStatus === 'PAID_FULL' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('PAID_FULL')}
            >
              Pagado
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
              <TableHead className="font-bold">Usuario</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="font-bold">Plan</TableHead>
              <TableHead className="font-bold">Método</TableHead>
              <TableHead className="font-bold">Pago</TableHead>
              <TableHead className="font-bold">Último Pago</TableHead>
              <TableHead className="font-bold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  No se encontraron suscripciones
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                        {sub.user.firstName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm dark:text-white capitalize">{sub.user.firstName} {sub.user.lastName}</p>
                        <p className="text-[10px] text-slate-500">{sub.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getSubscriptionStatusInfo(sub.status).bgColor} ${getSubscriptionStatusInfo(sub.status).color} border-0`}>
                      {getSubscriptionStatusInfo(sub.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      Plan de {sub.installments} {sub.installments === 1 ? 'pago' : 'cuotas'}
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                        {sub.installments === 1 
                          ? (sub.paidAmount >= sub.totalAmount ? 'PAGADO COMPLETO' : 'PENDIENTE') 
                          : `CUOTA ${Math.floor(sub.paidAmount / (sub.totalAmount / sub.installments))} DE ${sub.installments}`
                        }
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {sub.paymentMethod === 'WALLET' ? <Wallet className="w-3 h-3 text-indigo-500" /> : <Landmark className="w-3 h-3 text-slate-400" />}
                      <span className="truncate max-w-[100px]">
                        {sub.paymentMethod === 'WALLET' ? 'Billetera Oscorp' : 'Transf. Bancaria'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold">{Math.round((sub.paidAmount / sub.totalAmount) * 100)}%</span>
                        <span className="text-slate-400">{formatCurrency(sub.paidAmount)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(sub.paidAmount / sub.totalAmount) * 100}%` }}
                          className="h-full bg-indigo-600"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-500 font-medium">
                      {sub.updatedAt ? new Date(sub.updatedAt).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sub.status === 'PENDING_APPROVAL' && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedSub(sub);
                            setAmountPaid('');
                            setApproveDialogOpen(true);
                          }} className="text-emerald-600 font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aprobar Acceso
                          </DropdownMenuItem>
                        )}

                        {sub.status === 'ACTIVE' && sub.paidAmount < sub.totalAmount && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedSub(sub);
                            setAmountPaid('');
                            setApproveDialogOpen(true);
                          }} className="text-indigo-600 font-bold">
                            <Landmark className="w-4 h-4 mr-2" />
                            Actualizar Pago
                          </DropdownMenuItem>
                        )}

                        {sub.status === 'REVOKED' && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedSub(sub);
                            setAmountPaid('');
                            setApproveDialogOpen(true);
                          }} className="text-emerald-600 font-bold">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-activar Acceso
                          </DropdownMenuItem>
                        )}

                        {sub.receiptUrl && (
                          <DropdownMenuItem onClick={() => {
                            setSelectedSub(sub);
                            setReceiptDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Comprobante
                          </DropdownMenuItem>
                        )}
                        
                        {sub.status !== 'REVOKED' && (
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onSelect={(e) => e.preventDefault()}>
                              <Ban className="w-4 h-4 mr-2" />
                              Revocar Acceso
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black">¿Revocar acceso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El usuario ya no podrá interactuar con el módulo Ingenio. Podrás reactivarlo más tarde desde el panel de usuarios.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-2xl border-none bg-slate-100 font-bold">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevoke(sub.id)} className="rounded-2xl bg-rose-500 hover:bg-rose-600 font-black">Revocar Ahora</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar Registro
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black">¿Eliminar suscripción?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción borrará permanentemente todos los registros asociados a esta suscripción. El usuario perderá el acceso y el historial de pagos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-2xl border-none bg-slate-100 font-bold">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sub.id)} className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-black">Confirmar Eliminación</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Approval Modal */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
          <div className="p-6 pb-3 border-b dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">
                {selectedSub?.status === 'ACTIVE' ? 'Actualizar Pago' : 
                 selectedSub?.status === 'REVOKED' ? 'Re-activar Acceso' : 'Aprobar Suscripción'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedSub?.status === 'ACTIVE' 
                  ? `Registra un nuevo cobro para ${selectedSub?.user?.firstName}.`
                  : selectedSub?.status === 'REVOKED'
                  ? `Estás re-activando el acceso de ${selectedSub?.user?.firstName}. Puedes registrar un pago inicial si es necesario.`
                  : selectedSub?.paymentMethod === 'WALLET' 
                    ? 'El pago ya se realizó a través de la Billetera. Confirma la aprobación del acceso.' 
                    : 'Ingresa el monto cobrado de la transferencia bancaria para validarlo en el sistema.'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Resumen de Cuenta</p>
                 <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                    {selectedSub?.installments} Cuotas
                 </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Costo Total</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(selectedSub?.totalAmount || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deuda Pendiente</p>
                  <p className="text-sm font-black text-rose-500">{formatCurrency((selectedSub?.totalAmount || 0) - (selectedSub?.paidAmount || 0))}</p>
                </div>
              </div>
            </div>

            {selectedSub && selectedSub.installments > 1 && (
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estado de Cuotas
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from({ length: selectedSub.installments }).map((_, i) => {
                    const total = selectedSub.totalAmount;
                    const count = selectedSub.installments;
                    
                    // Calculate a clean rounded amount for all installments except the last one
                    // We round up to the nearest 1.000 to keep it "clean"
                    const roundedBase = Math.ceil((total / count) / 1000) * 1000;
                    
                    const instNumber = i + 1;
                    const isLast = instNumber === count;
                    
                    // The specific amount defined for this installment slot
                    const instAmount = isLast 
                      ? Math.max(0, total - (roundedBase * (count - 1)))
                      : roundedBase;
                    
                    // Logic to find how much of the paidAmount belongs to THIS specific installment
                    const currentPaidTotal = (selectedSub?.paidAmount || 0);
                    
                    // Previous slots total
                    const previousSlotsTotal = roundedBase * i;
                    const amountAlreadyPaidForThisSlot = Math.max(0, Math.min(instAmount, currentPaidTotal - previousSlotsTotal));
                    
                    const isPaid = amountAlreadyPaidForThisSlot >= (instAmount - 10);
                    const remainingForThis = instAmount - amountAlreadyPaidForThisSlot;
                    const isNext = !isPaid && (i === 0 || (selectedSub?.paidAmount || 0) >= (previousSlotsTotal - 10));

                    return (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPaid}
                        className={cn(
                          "flex flex-col h-auto py-3 px-3 gap-1 rounded-2xl border-2 transition-all text-left items-start",
                          isPaid 
                            ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-default" 
                            : isNext 
                              ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20" 
                              : "border-slate-100 dark:border-slate-800 opacity-50",
                        )}
                        onClick={() => remainingForThis > 0 && setAmountPaid(remainingForThis.toLocaleString('es-PY'))}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tighter",
                            isPaid ? "text-slate-500" : "text-slate-400"
                          )}>Cuota {instNumber}</span>
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : 
                           remainingForThis < instAmount && <Clock className="w-3 h-3 text-amber-500 shrink-0" />}
                        </div>
                        
                        <div className="mt-1">
                          <span className={cn(
                            "font-black text-xs block leading-tight",
                            isPaid ? "text-slate-500 dark:text-slate-400 line-through decoration-emerald-500/50" : "text-slate-900 dark:text-white"
                          )}>
                            {formatCurrency(instAmount)}
                          </span>
                          {!isPaid && amountAlreadyPaidForThisSlot > 0 && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                              Faltan {formatCurrency(remainingForThis)}
                            </span>
                          )}
                          {!isPaid && amountAlreadyPaidForThisSlot === 0 && (
                             <span className="text-[9px] text-slate-400 font-medium">Pendiente</span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSub?.status === 'PENDING_APPROVAL' && selectedSub?.receiptUrl ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Comprobante de Pago Enviado</Label>
                  {selectedSub.receipts?.length > 1 && (
                    <Badge variant="secondary" className="text-[9px] font-bold">
                      +{selectedSub.receipts.length - 1} anteriores
                    </Badge>
                  )}
                </div>
                <div className="rounded-xl border overflow-hidden bg-slate-950 flex justify-center p-2 shadow-inner">
                  <img 
                    src={selectedSub.receiptUrl} 
                    alt="Comprobante" 
                    className="max-h-[400px] w-auto mx-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            ) : (selectedSub?.status === 'ACTIVE' || selectedSub?.status === 'REVOKED') && (
              <div className="py-8 text-center text-slate-500 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 shadow-sm">
                   <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <p className="font-bold text-xs">Comprobante de pago aún no enviado</p>
                <p className="text-[10px] opacity-60">El usuario no ha reportado un nuevo pago para esta cuota.</p>
              </div>
            )}

            {(selectedSub?.paymentMethod === 'BANK_TRANSFER' || selectedSub?.status === 'ACTIVE' || selectedSub?.status === 'REVOKED') && (
              <div className="space-y-2">
                <Label>Monto a Registrar</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">Gs.</span>
                  <Input 
                    type="text" 
                    className="pl-11 font-black text-lg"
                    placeholder="0"
                    value={amountPaid}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (!raw) {
                        setAmountPaid('');
                        return;
                      }
                      const num = parseInt(raw, 10);
                      setAmountPaid(num.toLocaleString('es-PY'));
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800">
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 font-black">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  selectedSub?.status === 'ACTIVE' ? 'Registrar Pago' : 
                  selectedSub?.status === 'REVOKED' ? 'Re-activar Ahora' : 'Confirmar Aprobación'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
          <div className="p-6 pb-4 border-b dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Detalles del Comprobante</DialogTitle>
              <DialogDescription>
                Información del pago enviado por {selectedSub?.user?.firstName} {selectedSub?.user?.lastName}.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="bg-white dark:bg-slate-900 flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fecha de Envío</span>
                  </div>
                  <p className="text-sm font-black dark:text-white">
                    {selectedSub?.updatedAt ? new Date(selectedSub.updatedAt).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Estado Actual</span>
                  </div>
                  <div className="mt-0.5">
                    <Badge className={`${getSubscriptionStatusInfo(selectedSub?.status || '').bgColor} ${getSubscriptionStatusInfo(selectedSub?.status || '').color} border-0 text-[10px] font-bold`}>
                      {getSubscriptionStatusInfo(selectedSub?.status || '').label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Historial de Comprobantes</span>
                  <Badge variant="outline" className="text-[9px] font-black px-2 py-0 h-5">
                    {selectedSub?.receipts?.length || (selectedSub?.receiptUrl ? 1 : 0)} ARCHIVOS
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {selectedSub?.receipts && Array.isArray(selectedSub.receipts) && selectedSub.receipts.length > 0 ? (
                    [...selectedSub.receipts].reverse().map((r: any, idx: number) => (
                      <div key={idx} className="space-y-2 border-b dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                               {selectedSub.receipts.length - idx}
                             </div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               Enviado el {new Date(r.date).toLocaleDateString('es-PY')} a las {new Date(r.date).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                        </div>
                        <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-950 flex justify-center shadow-sm">
                           <img 
                              src={r.url} 
                              alt={`Comprobante ${selectedSub.receipts.length - idx}`} 
                              className="max-h-[60vh] w-auto mx-auto object-contain"
                            />
                        </div>
                      </div>
                    ))
                  ) : selectedSub?.receiptUrl ? (
                    <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-950 flex justify-center shadow-sm">
                       <img 
                          src={selectedSub.receiptUrl} 
                          alt="Comprobante" 
                          className="max-h-[60vh] w-auto mx-auto object-contain"
                        />
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <p className="font-bold text-sm">No hay comprobantes registrados</p>
                      <p className="text-xs opacity-60">El usuario aún no ha subido archivos.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/30">
              <Button onClick={() => setReceiptDialogOpen(false)} className="rounded-xl font-bold px-8">
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
