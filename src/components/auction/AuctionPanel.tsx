import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Gavel, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { auctionsApi } from '@/lib/api';
import { loginUrlFor, setPostLoginRedirect } from '@/lib/redirect';
import { useAuthStore } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCountdown } from './useCountdown';

interface AuctionView {
  status: string;
  endsAt: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  minNextBid: number;
  bidCount: number;
  bids: { id: string; amount: number; at: string; name: string; mine: boolean }[];
  iAmWinning: boolean;
  iWasOutbid: boolean;
  iWon: boolean;
  canPay: boolean;
  payBy: string | null;
}

interface Props {
  productId: string;
  initial: AuctionView | null;
  /** El ganador toca "Pagar": el padre agrega el producto al carrito y va al checkout. */
  onPay: () => void;
  readOnly?: boolean;
}

const fmtDate = (d: string) => new Date(d).toLocaleString('es-PY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const ago = (d: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
};

function Block({ value, label, hot }: { value: number; label: string; hot?: boolean }) {
  return (
    <div className={cn('flex flex-1 flex-col items-center rounded-lg py-2', hot ? 'bg-[#D52B1E]' : 'bg-white/10')}>
      <span className="text-2xl font-black tabular-nums leading-none text-white sm:text-3xl">{String(value).padStart(2, '0')}</span>
      <span className="mt-1 text-[11px] text-white/70">{label}</span>
    </div>
  );
}

/** Panel de ofertas de un remate: cuenta regresiva, oferta actual, ofertar y ledger de ofertas. */
export function AuctionPanel({ productId, initial, onPay, readOnly }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [auction, setAuction] = useState<AuctionView | null>(initial);
  const [amount, setAmount] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const t = useCountdown(auction?.status === 'open' ? auction.endsAt : null);

  const refresh = useCallback(async () => {
    try {
      setAuction(await auctionsApi.get(productId));
    } catch {
      // sin conexión: se conserva lo último que se vio
    }
  }, [productId]);

  useEffect(() => { setAuction(initial); }, [initial]);

  // Mientras el remate está abierto, se actualiza solo (ofertas de otros, extensión de tiempo, cierre)
  useEffect(() => {
    if (auction?.status !== 'open') return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [auction?.status, refresh]);

  useEffect(() => {
    if (auction?.status === 'open' && t.over) refresh();
  }, [auction?.status, t.over, refresh]);

  const parsed = useMemo(() => Number(amount.replace(/\D/g, '')) || 0, [amount]);
  if (!auction) return null;

  const open = auction.status === 'open' && !t.over;
  const minNext = auction.minNextBid;
  const quick = [0, 1, 4].map((k) => minNext + auction.minIncrement * k);
  const returnPath = location.pathname + location.search;

  const startBid = () => {
    setError('');
    if (!isAuthenticated) {
      // Para ofertar hace falta una cuenta: se va a iniciar sesión/registrarse y se vuelve a este remate
      navigate(loginUrlFor(returnPath));
      return;
    }
    if (parsed < minNext) {
      setError(`La oferta mínima es ${formatCurrency(minNext)}`);
      return;
    }
    setConfirming(true);
  };

  const sendBid = async () => {
    setSending(true);
    setError('');
    try {
      const res = await auctionsApi.bid(productId, parsed);
      setAuction(res.auction);
      setAmount('');
      setConfirming(false);
      toast.success(res.extended ? 'Oferta enviada. El remate se alargó 2 minutos.' : 'Oferta enviada. ¡Vas ganando!');
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar la oferta');
      setConfirming(false);
      refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-[#0B1F4B] text-white shadow-lg" aria-label="Remate">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {open ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF5A4E] opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF5A4E]" />
                </span>
                Remate en curso
              </>
            ) : (
              <>
                <Gavel className="h-4 w-4" aria-hidden />
                {auction.status === 'sold' ? 'Remate vendido' : auction.status === 'ended' ? 'Remate adjudicado' : 'Remate terminado'}
              </>
            )}
          </div>
          {open && <span className="text-xs text-white/70">Cierra {fmtDate(auction.endsAt)}</span>}
        </div>

        {open && (
          <div className="flex gap-2" role="timer" aria-label="Tiempo restante">
            {t.days > 0 && <Block value={t.days} label="días" />}
            <Block value={t.hours} label="horas" hot={t.urgent} />
            <Block value={t.minutes} label="min" hot={t.urgent} />
            <Block value={t.seconds} label="seg" hot={t.urgent} />
          </div>
        )}

        <div aria-live="polite">
          <p className="text-sm text-white/70">{auction.bidCount === 0 ? 'Precio inicial' : 'Oferta más alta'}</p>
          <p className="text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{formatCurrency(auction.currentPrice)}</p>
          <p className="mt-1 text-xs text-white/70">
            {auction.bidCount === 0 ? 'Todavía nadie ofertó' : `${auction.bidCount} ${auction.bidCount === 1 ? 'oferta' : 'ofertas'}`}
            {auction.bidCount > 0 && ` · empezó en ${formatCurrency(auction.startPrice)}`}
          </p>
        </div>

        {open && auction.iAmWinning && (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            <TrendingUp className="h-4 w-4" aria-hidden /> Vas ganando. Si nadie te supera, el remate es tuyo.
          </p>
        )}
        {open && auction.iWasOutbid && (
          <p className="flex items-center gap-2 rounded-lg bg-[#D52B1E]/30 px-3 py-2 text-sm font-semibold text-red-100">
            <TrendingDown className="h-4 w-4" aria-hidden /> Te superaron. Ofertá de nuevo para recuperar el primer lugar.
          </p>
        )}

        {/* Ofertar */}
        {open && !readOnly && !auction.iAmWinning && (
          <div className="space-y-3 rounded-xl bg-white p-3 text-slate-900">
            {!isAuthenticated && (
              <p className="text-sm text-slate-600">
                Para ofertar necesitás una cuenta. Al ofertar te pedimos iniciar sesión o registrarte y volvés a este remate.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {quick.map((q, i) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setAmount(q.toLocaleString('es-PY')); setConfirming(false); setError(''); }}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold tabular-nums hover:border-[#0B1F4B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B1F4B]"
                >
                  {i === 0 ? 'Oferta mínima' : formatCurrency(q)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Gs.</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setAmount(raw ? Number(raw).toLocaleString('es-PY') : '');
                    setConfirming(false);
                    setError('');
                  }}
                  placeholder={minNext.toLocaleString('es-PY')}
                  aria-label="Tu oferta en guaraníes"
                  className="h-12 w-full rounded-lg border border-slate-300 pl-11 pr-3 text-lg font-black tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B1F4B]"
                />
              </div>
              {!confirming && (
                <Button onClick={startBid} className="h-12 rounded-lg bg-[#D52B1E] px-5 font-bold hover:bg-[#B8231A]">
                  Ofertar
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Oferta mínima {formatCurrency(minNext)}. Cada oferta suma como mínimo {formatCurrency(auction.minIncrement)}.
            </p>
            {confirming && (
              <div className="space-y-2 rounded-lg bg-slate-100 p-3">
                <p className="text-sm">
                  Vas a ofertar <strong>{formatCurrency(parsed)}</strong>. Si ganás, tenés 48 horas para pagar. La oferta no se puede retirar.
                </p>
                <div className="flex gap-2">
                  <Button onClick={sendBid} disabled={sending} className="flex-1 bg-[#D52B1E] font-bold hover:bg-[#B8231A]">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar oferta'}
                  </Button>
                  <Button variant="outline" onClick={() => setConfirming(false)} disabled={sending}>Cancelar</Button>
                </div>
              </div>
            )}
            {error && <p role="alert" className="text-sm font-semibold text-[#D52B1E]">{error}</p>}
            {!isAuthenticated && (
              <p className="text-xs text-slate-500">
                ¿Todavía no tenés cuenta? <Link className="font-bold underline" to="/register" onClick={() => setPostLoginRedirect(returnPath)}>Crear cuenta</Link>
              </p>
            )}
          </div>
        )}

        {/* Final del remate */}
        {!open && auction.canPay && (
          <div className="space-y-2 rounded-xl bg-emerald-500/20 p-3">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-100">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> ¡Ganaste este remate!
            </p>
            {auction.payBy && <p className="text-xs text-emerald-100/80">Pagalo antes del {fmtDate(auction.payBy)}. Después se pierde.</p>}
            <Button onClick={onPay} className="h-12 w-full bg-white font-bold text-[#0B1F4B] hover:bg-slate-100">
              Pagar {formatCurrency(auction.currentPrice)}
            </Button>
          </div>
        )}
        {!open && !auction.canPay && (
          <p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
            {auction.status === 'sold' && 'Este producto ya se vendió.'}
            {auction.status === 'ended' && (auction.iWon ? 'Ganaste este remate.' : `Se adjudicó en ${formatCurrency(auction.currentPrice)}. Esperando el pago del ganador.`)}
            {auction.status === 'unpaid' && 'El ganador no pagó a tiempo. Puede volver a publicarse.'}
            {auction.status === 'unsold' && 'Terminó sin ofertas.'}
            {auction.status === 'open' && 'El remate está cerrando…'}
          </p>
        )}

        {/* Historial */}
        {auction.bids.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Ofertas</p>
            <ul className="divide-y divide-white/10 text-sm">
              {auction.bids.slice(0, 8).map((b, i) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-1.5">
                  <span className={cn('min-w-0 truncate', i === 0 ? 'font-bold' : 'text-white/80')}>
                    {b.mine ? 'Vos' : b.name}
                    <span className="ml-2 text-xs text-white/50">{ago(b.at)}</span>
                  </span>
                  <span className={cn('tabular-nums', i === 0 ? 'font-black' : 'text-white/80')}>{formatCurrency(b.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
