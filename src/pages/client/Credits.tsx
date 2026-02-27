import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2,
  Camera, X, Pencil, Trash2, Ban, FileText, TrendingUp, Sparkles
} from 'lucide-react';
import { creditsApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; badgeBg: string }> = {
  pending: { label: 'Pendiente', color: 'text-amber-500', icon: Clock, badgeBg: 'bg-amber-500/10 border-amber-500/20' },
  approved: { label: 'Aprobado', color: 'text-blue-500', icon: CheckCircle, badgeBg: 'bg-blue-500/10 border-blue-500/20' },
  active: { label: 'Activo', color: 'text-emerald-500', icon: CheckCircle, badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'Completado', color: 'text-muted-foreground', icon: CheckCircle, badgeBg: 'bg-white/5 border-white/10' },
  rejected: { label: 'Rechazado', color: 'text-rose-500', icon: AlertCircle, badgeBg: 'bg-rose-500/10 border-rose-500/20' },
  cancelled: { label: 'Cancelado', color: 'text-orange-500', icon: Ban, badgeBg: 'bg-orange-500/10 border-orange-500/20' },
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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-24 space-y-6 max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight">Mis Créditos</h1>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">Préstamos y solicitudes</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
          <TrendingUp className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      {/* Quick Action - Request */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => { resetForm(); setShowRequestModal(true); }}
        className="w-full text-left"
      >
        <div
          className="rounded-[2rem] p-5 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)',
            boxShadow: '0 15px 40px -10px rgba(99, 102, 241, 0.5)'
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/20 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-black text-white text-sm tracking-tight">Solicitar nuevo crédito</p>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.15em]">Financiamiento rápido</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { count: activeCredits.length, label: 'Activos', color: 'text-emerald-500', border: 'border-emerald-500/10' },
          { count: pendingCredits.length, label: 'Pendientes', color: 'text-amber-500', border: 'border-amber-500/10' },
          { count: completedCredits.length, label: 'Completados', color: 'text-blue-500', border: 'border-blue-500/10' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn("glass-premium rounded-2xl p-4 text-center border shadow-lg", stat.border)}
          >
            <p className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.count}</p>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Credits List */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">Historial de créditos</h2>

        {credits.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
              <CreditCard className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">No tienes créditos</h3>
              <p className="text-xs text-muted-foreground/60 font-medium mt-1">Solicita tu primer crédito</p>
            </div>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => { resetForm(); setShowRequestModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20 px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Solicitar crédito
              </Button>
            </motion.div>
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
                className="glass-premium rounded-[2rem] p-5 border border-white/5 shadow-xl space-y-4 hover:border-white/10 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm tracking-tight truncate">{credit.concept}</p>
                    <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.15em] mt-0.5">
                      Solicitado el {formatDate(credit.createdAt)}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.15em]", status.badgeBg)}>
                    <StatusIcon className={cn("w-3 h-3", status.color)} />
                    <span className={status.color}>{status.label}</span>
                  </div>
                </div>

                {/* Amount Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.15em]">Monto</p>
                    <p className="font-black text-sm tracking-tight mt-0.5">{formatCurrency(credit.amount)}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.15em]">Total a pagar</p>
                    <p className="font-black text-sm tracking-tight mt-0.5">{formatCurrency(credit.totalToPay)}</p>
                  </div>
                </div>

                {/* Installments info */}
                <p className="text-[10px] text-muted-foreground/50 font-bold">
                  {credit.installments} cuotas de <span className="font-black text-foreground/80">{formatCurrency(credit.installmentAmount)}</span>
                </p>

                {/* Documents indicator */}
                {credit.documents?.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-bold">{credit.documents.length} documento(s) adjunto(s)</span>
                  </div>
                )}

                {/* Active credit: payment progress */}
                {isActive && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground/50 font-bold uppercase tracking-[0.15em]">Progreso de pago</span>
                      <span className="font-black">{paidInstallments}/{credit.installments} cuotas</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    {nextInstallment && (
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20"
                          onClick={() => handlePayInstallment(credit.id, nextInstallment.id)}
                          disabled={payingCreditId === credit.id}
                        >
                          {payingCreditId === credit.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Pagar cuota - {formatCurrency(credit.installmentAmount)}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Pending credit: action buttons */}
                {isPending && (
                  <div className="flex gap-2">
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl h-10 border-white/10 font-bold text-xs"
                        onClick={() => openEditModal(credit)}
                        disabled={actionLoading === credit.id}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl h-10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10 font-bold text-xs"
                        onClick={() => handleCancelCredit(credit.id)}
                        disabled={actionLoading === credit.id}
                      >
                        {actionLoading === credit.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Ban className="w-3.5 h-3.5 mr-1.5" />}
                        Cancelar
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                        onClick={() => setDeleteConfirmId(credit.id)}
                        disabled={actionLoading === credit.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ─── Request / Edit Credit Modal ─────────────────────────── */}
      <Dialog open={showRequestModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-md glass-premium border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight text-lg">
              {editingCredit ? 'Editar Solicitud' : formStep === 1 ? 'Solicitar Crédito' : 'Documentos de Identidad'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/60">
              {editingCredit
                ? 'Modifica los datos de tu solicitud de crédito.'
                : formStep === 1
                  ? 'Completa los datos para solicitar un nuevo crédito.'
                  : 'Sube fotos de tu cédula de identidad (frente y dorso).'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Credit details */}
          {formStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50" htmlFor="credit-amount">Monto solicitado (₲)</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  placeholder="Ej: 500000"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  className="bg-white/5 border-white/10 rounded-xl h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50" htmlFor="credit-concept">Concepto</Label>
                <Textarea
                  id="credit-concept"
                  placeholder="Describe para qué necesitas el crédito..."
                  value={requestForm.concept}
                  onChange={(e) => setRequestForm({ ...requestForm, concept: e.target.value })}
                  className="bg-white/5 border-white/10 rounded-xl min-h-[80px] font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50" htmlFor="credit-installments">Cantidad de cuotas</Label>
                <select
                  id="credit-installments"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium"
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
                <div className="bg-white/[0.02] rounded-2xl p-4 text-sm space-y-2 border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-[0.15em]">Monto:</span>
                    <span className="font-black text-sm">{formatCurrency(parseFloat(requestForm.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-[0.15em]">Cuotas:</span>
                    <span className="font-bold text-sm">{requestForm.installments}x de {formatCurrency(parseFloat(requestForm.amount) / parseInt(requestForm.installments))}</span>
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
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Cédula - Frente</Label>
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
                  className="border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-2xl p-4 text-center cursor-pointer transition-all"
                >
                  {idFrontPreview ? (
                    <div className="relative">
                      <img src={idFrontPreview} alt="Cédula frente" className="w-full h-36 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIdFrontFile(null); URL.revokeObjectURL(idFrontPreview); setIdFrontPreview(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold">Tomar foto o seleccionar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Back */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Cédula - Dorso</Label>
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
                  className="border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-2xl p-4 text-center cursor-pointer transition-all"
                >
                  {idBackPreview ? (
                    <div className="relative">
                      <img src={idBackPreview} alt="Cédula dorso" className="w-full h-36 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIdBackFile(null); URL.revokeObjectURL(idBackPreview); setIdBackPreview(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold">Tomar foto o seleccionar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {formStep === 1 ? (
              <>
                <Button variant="outline" onClick={resetForm} className="rounded-xl border-white/10 font-bold">Cancelar</Button>
                <Button onClick={handleRequestCredit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-black shadow-lg shadow-blue-500/20">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingCredit ? 'Guardar cambios' : 'Siguiente'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSkipDocuments} className="text-muted-foreground/40 font-bold text-xs">
                  Omitir por ahora
                </Button>
                <Button onClick={handleUploadDocuments} disabled={isUploading || !idFrontFile || !idBackFile} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-black shadow-lg shadow-blue-500/20">
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
        <AlertDialogContent className="glass-premium border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black tracking-tight">Eliminar solicitud</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground/60">
              Esta acción eliminará permanentemente tu solicitud de crédito. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteCredit(deleteConfirmId)}
              className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black shadow-lg"
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
