import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2,
  Camera, X, Pencil, Trash2, Ban, FileText
} from 'lucide-react';
import { creditsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CheckCircle },
  active: { label: 'Activo', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: Ban },
};

export default function ClientCredits() {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingCreditId, setPayingCreditId] = useState<string | null>(null);

  // Request/edit modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ amount: '', concept: '', installments: '3' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [createdCreditId, setCreatedCreditId] = useState<string | null>(null);
  const [editingCredit, setEditingCredit] = useState<any | null>(null);

  // Document upload
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      const data = await creditsApi.getAll();
      setCredits(data);
    } catch {
      toast.error('Error al cargar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCredits(); }, []);

  const activeCredits = credits.filter((c: any) => c.status === 'active');
  const pendingCredits = credits.filter((c: any) => c.status === 'pending');
  const completedCredits = credits.filter((c: any) => c.status === 'completed');

  // ─── Handlers ───────────────────────────────────────────────────

  const resetForm = () => {
    setShowRequestModal(false);
    setFormStep(1);
    setCreatedCreditId(null);
    setEditingCredit(null);
    setRequestForm({ amount: '', concept: '', installments: '3' });
    setIdFrontFile(null);
    setIdBackFile(null);
    if (idFrontPreview) URL.revokeObjectURL(idFrontPreview);
    if (idBackPreview) URL.revokeObjectURL(idBackPreview);
    setIdFrontPreview(null);
    setIdBackPreview(null);
  };

  const handleRequestCredit = async () => {
    const amount = parseFloat(requestForm.amount);
    if (!amount || amount <= 0) { toast.error('Ingresa un monto válido'); return; }
    if (!requestForm.concept.trim()) { toast.error('Ingresa el concepto del crédito'); return; }

    try {
      setIsSubmitting(true);
      if (editingCredit) {
        await creditsApi.update(editingCredit.id, {
          amount,
          concept: requestForm.concept,
          installments: parseInt(requestForm.installments),
        });
        toast.success('Crédito actualizado');
        resetForm();
        await fetchCredits();
      } else {
        const credit = await creditsApi.create({
          amount,
          concept: requestForm.concept,
          installments: parseInt(requestForm.installments),
        });
        setCreatedCreditId(credit.id);
        setFormStep(2);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!createdCreditId) return;
    if (!idFrontFile || !idBackFile) { toast.error('Debes subir ambas fotos de tu cédula'); return; }

    try {
      setIsUploading(true);
      await creditsApi.uploadDocuments(createdCreditId, [
        { file: idFrontFile, type: 'id_front' },
        { file: idBackFile, type: 'id_back' },
      ]);
      toast.success('Solicitud enviada con documentos');
      resetForm();
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al subir documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipDocuments = () => {
    toast.success('Solicitud de crédito enviada');
    resetForm();
    fetchCredits();
  };

  const handleFileSelect = (file: File, side: 'front' | 'back') => {
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return; }
    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      if (idFrontPreview) URL.revokeObjectURL(idFrontPreview);
      setIdFrontFile(file);
      setIdFrontPreview(previewUrl);
    } else {
      if (idBackPreview) URL.revokeObjectURL(idBackPreview);
      setIdBackFile(file);
      setIdBackPreview(previewUrl);
    }
  };

  const handleCancelCredit = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.cancel(creditId);
      toast.success('Solicitud cancelada');
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    try {
      setActionLoading(creditId);
      await creditsApi.remove(creditId);
      toast.success('Solicitud eliminada');
      setDeleteConfirmId(null);
      await fetchCredits();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setActionLoading(null);
    }
  };

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

  const openEditModal = (credit: any) => {
    setEditingCredit(credit);
    setRequestForm({
      amount: String(credit.amount),
      concept: credit.concept,
      installments: String(credit.installments),
    });
    setFormStep(1);
    setShowRequestModal(true);
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold text-foreground">Mis Créditos</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus préstamos y solicitudes</p>
      </div>

      {/* Quick Action */}
      <div className="px-4">
        <button onClick={() => { resetForm(); setShowRequestModal(true); }} className="w-full text-left">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-lg transition-shadow border-0">
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
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{activeCredits.length}</p>
          <p className="text-xs text-muted-foreground">Activos</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{pendingCredits.length}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completedCredits.length}</p>
          <p className="text-xs text-muted-foreground">Completados</p>
        </CardContent></Card>
      </div>

      {/* Credits List */}
      <div className="px-4 space-y-3">
        <h2 className="font-semibold text-foreground">Historial de créditos</h2>

        {credits.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No tienes créditos</h3>
            <p className="text-muted-foreground mb-4">Solicita tu primer crédito</p>
            <Button onClick={() => { resetForm(); setShowRequestModal(true); }}>Solicitar crédito</Button>
          </div>
        )}

        <AnimatePresence>
          {credits.map((credit: any, index: number) => {
            const status = statusConfig[credit.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const paidInstallments = credit.payments?.length || 0;
            const progress = credit.installments > 0 ? (paidInstallments / credit.installments) * 100 : 0;
            const nextInstallment = credit.paymentSchedule?.find((s: any) => s.status === 'pending');
            const isPending = credit.status === 'pending';
            const isActive = credit.status === 'active';

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
                        <p className="font-semibold text-foreground">{credit.concept}</p>
                        <p className="text-sm text-muted-foreground">Solicitado el {formatDate(credit.createdAt)}</p>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Monto</p>
                        <p className="font-bold text-foreground">{formatCurrency(credit.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total a pagar</p>
                        <p className="font-bold text-foreground">{formatCurrency(credit.totalToPay)}</p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {credit.installments} cuotas de {formatCurrency(credit.installmentAmount)}
                    </div>

                    {/* Documents indicator */}
                    {credit.documents?.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <FileText className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">{credit.documents.length} documento(s) adjunto(s)</span>
                      </div>
                    )}

                    {/* Active credit: payment progress */}
                    {isActive && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progreso de pago</span>
                          <span className="font-medium text-foreground">{paidInstallments}/{credit.installments} cuotas</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {nextInstallment && (
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
                      </div>
                    )}

                    {/* Pending credit: action buttons */}
                    {isPending && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditModal(credit)}
                          disabled={actionLoading === credit.id}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-500/30 dark:hover:bg-orange-500/10"
                          onClick={() => handleCancelCredit(credit.id)}
                          disabled={actionLoading === credit.id}
                        >
                          {actionLoading === credit.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Ban className="w-3.5 h-3.5 mr-1" />}
                          Cancelar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                          onClick={() => setDeleteConfirmId(credit.id)}
                          disabled={actionLoading === credit.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── Request / Edit Credit Modal ─────────────────────────── */}
      <Dialog open={showRequestModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCredit ? 'Editar Solicitud' : formStep === 1 ? 'Solicitar Crédito' : 'Documentos de Identidad'}
            </DialogTitle>
            <DialogDescription>
              {editingCredit
                ? 'Modifica los datos de tu solicitud de crédito.'
                : formStep === 1
                  ? 'Completa los datos para solicitar un nuevo crédito.'
                  : 'Sube fotos de tu cédula de identidad (frente y dorso) para agilizar la aprobación.'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Credit details */}
          {formStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="credit-amount">Monto solicitado (₲)</Label>
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
                <Label htmlFor="credit-installments">Cantidad de cuotas</Label>
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
              {requestForm.amount && parseFloat(requestForm.amount) > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(requestForm.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuotas:</span>
                    <span className="font-medium">{requestForm.installments}x de {formatCurrency(parseFloat(requestForm.amount) / parseInt(requestForm.installments))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Document upload */}
          {formStep === 2 && (
            <div className="space-y-4 py-2">
              {/* ID Front */}
              <div className="space-y-2">
                <Label>Cédula de Identidad - Frente</Label>
                <input
                  ref={idFrontRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'front');
                    e.target.value = '';
                  }}
                />
                <div
                  onClick={() => idFrontRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  {idFrontPreview ? (
                    <div className="relative">
                      <img src={idFrontPreview} alt="Cédula frente" className="w-full h-36 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIdFrontFile(null); URL.revokeObjectURL(idFrontPreview); setIdFrontPreview(null); }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <Camera className="w-8 h-8" />
                      <span className="text-sm">Tomar foto o seleccionar archivo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Back */}
              <div className="space-y-2">
                <Label>Cédula de Identidad - Dorso</Label>
                <input
                  ref={idBackRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'back');
                    e.target.value = '';
                  }}
                />
                <div
                  onClick={() => idBackRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  {idBackPreview ? (
                    <div className="relative">
                      <img src={idBackPreview} alt="Cédula dorso" className="w-full h-36 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIdBackFile(null); URL.revokeObjectURL(idBackPreview); setIdBackPreview(null); }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <Camera className="w-8 h-8" />
                      <span className="text-sm">Tomar foto o seleccionar archivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {formStep === 1 ? (
              <>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleRequestCredit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingCredit ? 'Guardar cambios' : 'Siguiente'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSkipDocuments} className="text-muted-foreground">
                  Omitir por ahora
                </Button>
                <Button onClick={handleUploadDocuments} disabled={isUploading || !idFrontFile || !idBackFile}>
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Enviar solicitud
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─────────────────────────────────── */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar solicitud</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente tu solicitud de crédito. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteCredit(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === deleteConfirmId && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
