import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Megaphone, Copy, Check, MessageCircle, Facebook, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores';
import { affiliatesApi } from '@/lib/api';
import { getAffiliateProgram, getVisitorId, type AffiliateProgram } from '@/lib/affiliate';
import { loginUrlFor } from '@/lib/redirect';
import { cn } from '@/lib/utils';

interface PromoteButtonProps {
  kind: 'product' | 'store';
  productId?: string;
  storeSlug?: string;
  /** Nombre del producto o tienda, para el mensaje al compartir */
  title: string;
  rate?: number | null;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function PromoteButton({ kind, productId, storeSlug, title, rate, className, variant = 'outline', size = 'default' }: PromoteButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const label = kind === 'product' ? 'Promocionar este producto' : 'Promocionar esta tienda';

  const getLink = async () => {
    const { path } = await affiliatesApi.createLink(kind === 'product' ? { productId } : { storeSlug });
    setShareUrl(`${window.location.origin}${path}`);
  };

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión o regístrate para obtener tu enlace de afiliado');
      navigate(loginUrlFor(location.pathname + location.search));
      return;
    }
    setLoading(true);
    try {
      const me = await affiliatesApi.getMe();
      if (!me.profile) {
        setProgram(await getAffiliateProgram());
        setAccepted(false);
        setJoinOpen(true);
        return;
      }
      if (me.profile.status === 'pending') {
        toast.info('Tu cuenta de afiliado está pendiente de aprobación. Te avisaremos cuando esté activa.');
        return;
      }
      if (me.profile.status === 'suspended') {
        toast.error('Tu cuenta de afiliado está suspendida. Contacta con soporte.');
        return;
      }
      await getLink();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo generar el enlace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    try {
      const { profile } = await affiliatesApi.join(getVisitorId());
      setJoinOpen(false);
      if (profile.status !== 'active') {
        toast.success('¡Listo! Tu solicitud de afiliado quedó pendiente de aprobación.');
        return;
      }
      toast.success('¡Ya sos afiliado de OSCORP!');
      await getLink();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  };

  const shareText = kind === 'product' ? `Mirá este producto: ${title}` : `Conocé la tienda ${title}`;

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar. Seleccioná el enlace y copialo a mano.');
    }
  };

  const nativeShare = async () => {
    if (!shareUrl || !navigator.share) return;
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch {
      // cancelado por el usuario
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={cn('gap-2', className)}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
        {label}
      </Button>

      {/* Alta en el programa */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Unite al programa de afiliados</DialogTitle>
            <DialogDescription>
              Compartí productos y tiendas de OSCORP y ganá una comisión por cada venta que se haga desde tu enlace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cobrás el % que fija cada tienda sobre el precio del producto (sin envío).</li>
              <li>
                La venta es tuya si la persona compra dentro de los {program?.cookieDays ?? 30} días después de tocar tu enlace
                y ese fue el último enlace de afiliado que usó.
              </li>
              <li>
                La comisión aparece como <strong>Pendiente</strong> en tu billetera al comprar y queda disponible para retirar
                {program?.holdDays ? ` ${program.holdDays} días después de la entrega` : ' cuando se entrega el pedido'}.
              </li>
              <li>No hay comisión por compras propias. Si el pedido se cancela, la comisión se anula.</li>
              <li>OSCORP puede suspender cuentas ante cualquier uso fraudulento.</li>
            </ul>
            <label className="flex items-start gap-2 pt-2 text-foreground cursor-pointer">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
              <span>Acepto los términos del programa de afiliados de OSCORP.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancelar</Button>
            <Button onClick={handleJoin} disabled={!accepted || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unirme y obtener mi enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enlace para compartir */}
      <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Tu enlace de afiliado</DialogTitle>
            <DialogDescription>
              {kind === 'product'
                ? `Ganás ${rate ? `${rate}% ` : 'comisión '}por cada venta de ${title} hecha desde este enlace.`
                : `Ganás comisión por los productos de ${title} que participan, comprados desde este enlace.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl ?? ''} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
            <Button onClick={copy} variant="secondary" className="shrink-0" aria-label="Copiar enlace">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </a>
            </Button>
            <Button asChild className="bg-[#1877F2] hover:bg-[#1466d1] text-white">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl ?? '')}`} target="_blank" rel="noopener noreferrer">
                <Facebook className="w-4 h-4 mr-2" /> Facebook
              </a>
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button variant="outline" onClick={nativeShare} className="col-span-2 sm:col-span-1">
                <Share2 className="w-4 h-4 mr-2" /> Más
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Mirá los clics y ventas de tus enlaces en{' '}
            <Link to="/app/afiliados" className="text-primary font-medium hover:underline" onClick={() => setShareUrl(null)}>
              Mis promociones
            </Link>.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AffiliateBadge({ rate, className }: { rate: number | null | undefined; className?: string }) {
  if (!rate) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2.5 py-0.5 text-[11px] font-bold',
        className,
      )}
      title="Comisión para afiliados que promocionen este producto"
    >
      <Megaphone className="w-3 h-3" />
      Comisión {rate}%
    </span>
  );
}
