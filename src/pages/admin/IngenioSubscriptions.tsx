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
  Ban
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
import { formatCurrency, cn } from '@/lib/utils';
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
        <Button onClick={fetchSubscriptions} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Actualizar
        </Button>
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
              <TableHead className="font-bold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
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
                    <Badge className={cn(
                      "capitalize border-none",
                      sub.status === 'ACTIVE' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      sub.status === 'PENDING_APPROVAL' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      sub.status === 'REVOKED' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {sub.status === 'PENDING_APPROVAL' ? 'Pendiente' : sub.status}
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
                      {sub.paymentMethod === 'WALLET' ? <Wallet className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}
                      {sub.paymentMethod === 'WALLET' ? 'Billetera' : 'Banco'}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSub?.status === 'ACTIVE' ? 'Actualizar Pago' : 
               selectedSub?.status === 'REVOKED' ? 'Re-activar Acceso' : 'Aprobar Suscripción'}
            </DialogTitle>
            <DialogDescription>
              {selectedSub?.status === 'ACTIVE' 
                ? `Registra un nuevo cobro para ${selectedSub?.user?.firstName}.`
                : selectedSub?.status === 'REVOKED'
                ? `Estás re-activando el acceso de ${selectedSub?.user?.firstName}. Puedes registrar un pago inicial si es necesario.`
                : selectedSub?.paymentMethod === 'WALLET' 
                  ? 'El pago ya se realizó a través de la Billetera. Confirma la aprobación del acceso.' 
                  : 'Ingresa el monto cobrado de la transferencia bancaria para validarlo en el sistema.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
