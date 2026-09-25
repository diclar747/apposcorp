import { affiliatesApi } from '@/lib/api';

// Identificador anónimo del navegador (cookie propia de 1 año). El servidor guarda cada clic de afiliado
// con este id, así la referencia sobrevive aunque el visitante cierre el navegador o inicie sesión.
const VISITOR_COOKIE = 'osc_vid';

const readCookie = (name: string) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const writeCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const getVisitorId = (): string => {
  let id = readCookie(VISITOR_COOKIE);
  if (!id || id.length > 64) {
    id = newId();
    writeCookie(VISITOR_COOKIE, id, 365);
  }
  return id;
};

/** Registra la visita si la URL trae ?ref=CODIGO. Falla en silencio: nunca debe romper la página. */
export const trackReferral = async (target: { productSlug?: string; storeSlug?: string }, search: string) => {
  const code = new URLSearchParams(search).get('ref');
  if (!code || !/^[A-Za-z0-9]{4,16}$/.test(code)) return;
  try {
    await affiliatesApi.track({ code, visitorId: getVisitorId(), ...target });
  } catch {
    // sin conexión o programa apagado: se ignora
  }
};

let programCache: Promise<AffiliateProgram> | null = null;

export interface AffiliateProgram {
  enabled: boolean;
  minRate: number;
  maxRate: number;
  cookieDays: number;
  holdDays: number;
  showRatePublic: boolean;
  codEnabled: boolean;
}

export const getAffiliateProgram = (): Promise<AffiliateProgram> => {
  if (!programCache) {
    programCache = affiliatesApi.getProgram().catch(() => {
      programCache = null;
      return { enabled: false, minRate: 1, maxRate: 50, cookieDays: 30, holdDays: 7, showRatePublic: true, codEnabled: true };
    });
  }
  return programCache;
};

export const resetAffiliateProgramCache = () => {
  programCache = null;
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  reversed: 'Revertida',
};

export const COMMISSION_STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400',
  reversed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

/** Margen que queda después de la comisión de plataforma y la de afiliado (null si no hay costo cargado). */
export const marginAfterCommissions = (price: number, cost: number | null | undefined, affiliateRate: number, platformRate: number) => {
  if (!cost || cost <= 0 || !price) return null;
  return price - cost - (price * (affiliateRate + platformRate)) / 100;
};
