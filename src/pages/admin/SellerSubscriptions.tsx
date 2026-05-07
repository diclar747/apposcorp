import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Landmark, 
  MoreHorizontal, 
  RefreshCw,
  Trash2,
  Ban,
  Eye,
  Store,
  Loader2
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
import { sellerSubscriptionsApi } from '@/lib/api';
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
import { getSafeDate, formatDate } from '@/lib/utils';

export default function SellerSubscriptions() {
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
      const data = await sellerSubscriptionsApi.getAll();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching seller subscriptions:', error);
      toast.error('Error al cargar suscripciones de vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSub) return;
    
    const rawAmount = typeof amountPaid === 'string' ? parseInt(amountPaid.replace(/\D/g, '') || '0', 10) : (amountPaid || 0);

    try {
      setIsSubmitting(true);
      await sellerSubscriptionsApi.approve(selectedSub.id, rawAmount || selectedSub.totalAmount);
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
      await sellerSubscriptionsApi.revoke(id);
      toast.success('Acceso revocado');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || 'Error al revocar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await sellerSubscriptionsApi.delete(id);
      toast.success('Suscripción eliminada');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = filterStatus === 'all' || sub.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            Suscripciones Vendedores
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Control de pagos y accesos a planes de vendedores</p>
        </div>
        <div className="flex gap-2">
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vencidas / Por Vencer</p>
            <p className="text-2xl font-black text-rose-600">
              {subscriptions.filter(s => s.status === 'EXPIRED' || (s.expiresAt && new Date(s.expiresAt).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000 && s.status === 'ACTIVE')).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recaudado</p>
            <p className="text-2xl font-black text-blue-600">
              {formatCurrency(subscriptions.reduce((acc, curr) => acc + curr.paidAmount, 0))}
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
              variant={filterStatus === 'EXPIRED' ? 'secondary' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('EXPIRED')}
            >
              Vencidos
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan / Ciclo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No se encontraron suscripciones de vendedores
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sub.user?.firstName} {sub.user?.lastName}
                      </span>
                      <span className="text-xs text-slate-500">{sub.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {sub.plan?.name}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">
                        {sub.billingCycle === 'monthly' ? 'Mensual' : 
                         sub.billingCycle === 'quarterly' ? 'Trimestral' : 
                         sub.billingCycle === 'semi_annual' ? 'Semestral' : 'Anual'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getSubscriptionStatusInfo(sub.status).color
                      )} />
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        getSubscriptionStatusInfo(sub.status).bgColor,
                        getSubscriptionStatusInfo(sub.status).color
                      )}>
                        {getSubscriptionStatusInfo(sub.status).label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(sub.totalAmount)}
                      </span>
                      {sub.paidAmount > 0 && (
                        <span className="text-[10px] text-green-600 font-bold">
                          Pagado: {formatCurrency(sub.paidAmount)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xs font-medium",
                        sub.expiresAt && new Date(sub.expiresAt) < new Date() ? "text-rose-600 font-bold" : "text-slate-500"
                      )}>
                        {sub.expiresAt ? formatDate(getSafeDate(sub.expiresAt)) : 'N/A'}
                      </span>
                      {sub.expiresAt && new Date(sub.expiresAt) > new Date() && (
                        <span className="text-[10px] text-slate-400">
                          {Math.ceil((new Date(sub.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                        </span>
                      )}
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
                            setAmountPaid(sub.totalAmount.toString());
                            setApproveDialogOpen(true);
                          }} className="text-emerald-600 font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aprobar Plan
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
                              Revocar Plan
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black">¿Revocar plan del vendedor?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El vendedor ya no podrá utilizar las funciones premium ni su plan activo.
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
                                Esta acción borrará permanentemente el registro de este plan.
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
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Aprobar Plan</DialogTitle>
            <DialogDescription>
              Confirma que has recibido el pago por la suscripción de este vendedor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Monto a Aprobar</p>
              <Input
                type="text"
                value={amountPaid ? parseInt(amountPaid.replace(/\D/g, '') || '0').toLocaleString('es-PY') : ''}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="text-2xl font-black h-14"
              />
            </div>
            
            {selectedSub?.receiptUrl && (
              <div className="space-y-2">
                <Label>Comprobante de Pago Enviado</Label>
                <div className="rounded-xl border overflow-hidden bg-slate-950 flex justify-center p-2 shadow-inner">
                  <img 
                    src={selectedSub.receiptUrl} 
                    alt="Comprobante" 
                    className="max-h-[200px] w-auto mx-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              Aprobar Suscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl max-h-[92vh] flex flex-col">
          <div className="p-6 pb-4 border-b dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Detalles del Comprobante</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="bg-white dark:bg-slate-900 flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuario</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedSub?.user?.firstName} {selectedSub?.user?.lastName}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedSub?.plan?.name}</p>
                </div>
              </div>

              {selectedSub?.receiptUrl && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comprobante Actual</Label>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-950 flex justify-center shadow-sm p-4">
                     <img 
                         src={selectedSub.receiptUrl} 
                         alt="Comprobante Actual" 
                         className="w-full max-w-[500px] h-auto object-contain rounded-lg"
                      />
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
