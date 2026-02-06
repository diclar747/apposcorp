import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { creditsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function ClientCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingCreditId, setPayingCreditId] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ amount: '', concept: '', installments: '3' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const data = await creditsApi.getAll();
      setCredits(data);
    } catch (error) {
      toast.error('Error al cargar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const activeCredits = credits.filter((c: any) => c.status === 'active');
  const pendingCredits = credits.filter((c: any) => c.status === 'pending');
  const completedCredits = credits.filter((c: any) => c.status === 'completed');

  const handlePayInstallment = async (creditId: string, installmentId: string) => {
    try {
      setPayingCreditId(creditId);
      await creditsApi.payInstallment(creditId, installmentId, 'wallet');
      toast.success('Cuota pagada exitosamente');
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al pagar cuota');
    } finally {
      setPayingCreditId(null);
    }
  };

  const handleRequestCredit = async () => {
    const amount = parseFloat(requestForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!requestForm.concept.trim()) {
      toast.error('Ingresa el concepto del crédito');
      return;
    }

    try {
      setIsSubmitting(true);
      await creditsApi.create({
        amount,
        concept: requestForm.concept,
        installments: parseInt(requestForm.installments),
      });
      toast.success('Solicitud de crédito enviada');
      setShowRequestModal(false);
      setRequestForm({ amount: '', concept: '', installments: '3' });
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar crédito');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-gray-900">Mis Créditos</h1>
        <p className="text-sm text-gray-500">Gestiona tus préstamos</p>
      </div>

      {/* Quick Action */}
      <div className="px-4">
        <button onClick={() => setShowRequestModal(true)} className="w-full text-left">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Solicitar nuevo crédito</p>
                    <p className="text-sm text-white/80">Obtén financiamiento rápido</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{activeCredits.length}</p>
            <p className="text-xs text-gray-500">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{pendingCredits.length}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{completedCredits.length}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Credits List */}
      <div className="px-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Historial de créditos</h2>

        {credits.map((credit: any, index: number) => {
          const status = statusConfig[credit.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          const paidInstallments = credit.payments?.length || 0;
          const progress = credit.installments > 0 ? (paidInstallments / credit.installments) * 100 : 0;
          const nextInstallment = credit.paymentSchedule?.find((s: any) => s.status === 'pending');

          return (
            <motion.div
              key={credit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{credit.concept}</p>
                      <p className="text-sm text-gray-500">Solicitado el {formatDate(credit.createdAt)}</p>
                    </div>
                    <Badge className={`${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Monto</p>
                      <p className="font-bold">{formatCurrency(credit.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total a pagar</p>
                      <p className="font-bold">{formatCurrency(credit.totalToPay)}</p>
                    </div>
                  </div>

                  {credit.status === 'active' && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Progreso de pago</span>
                        <span className="font-medium">{paidInstallments}/{credit.installments} cuotas</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {nextInstallment && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">Próxima cuota</span>
                          <span className="font-medium">{formatCurrency(credit.installmentAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {credit.status === 'active' && nextInstallment && (
                    <Button
                      className="w-full mt-3"
                      variant="outline"
                      onClick={() => handlePayInstallment(credit.id, nextInstallment.id)}
                      disabled={payingCreditId === credit.id}
                    >
                      {payingCreditId === credit.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Pagar cuota - {formatCurrency(credit.installmentAmount)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {credits.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tienes créditos</h3>
          <p className="text-gray-500 mb-4">Solicita tu primer crédito</p>
          <Button onClick={() => setShowRequestModal(true)}>Solicitar crédito</Button>
        </div>
      )}

      {/* Request Credit Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Crédito</DialogTitle>
            <DialogDescription>
              Completa los datos para solicitar un nuevo crédito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Monto solicitado</Label>
              <Input
                id="credit-amount"
                type="number"
                placeholder="Ej: 500000"
                value={requestForm.amount}
                onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-concept">Concepto</Label>
              <Textarea
                id="credit-concept"
                placeholder="Describe para qué necesitas el crédito..."
                value={requestForm.concept}
                onChange={(e) => setRequestForm({ ...requestForm, concept: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-installments">Cuotas</Label>
              <select
                id="credit-installments"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={requestForm.installments}
                onChange={(e) => setRequestForm({ ...requestForm, installments: e.target.value })}
              >
                <option value="3">3 cuotas</option>
                <option value="6">6 cuotas</option>
                <option value="12">12 cuotas</option>
                <option value="18">18 cuotas</option>
                <option value="24">24 cuotas</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancelar</Button>
            <Button onClick={handleRequestCredit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
