import { prisma } from '../utils/prisma.js';
import { sendPushToUser } from './pushService.js';

// Prueba gratis de tiendas.
// Una tienda en prueba tiene planActive = true, planId = null e isTrial = true; vence en planExpiryDate.
// trialEndsAt queda guardado como historial (sirve para avisar "tu prueba terminó").

export const TRIAL_DAYS_KEY = 'seller_trial_days';
export const MAX_TRIAL_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Días de prueba que recibe cada vendedor nuevo al registrarse (0 = sin prueba). */
export const getTrialDays = async (): Promise<number> => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: TRIAL_DAYS_KEY } });
  const days = parseInt(setting?.value ?? '0', 10);
  return Number.isFinite(days) && days > 0 ? Math.min(days, MAX_TRIAL_DAYS) : 0;
};

/** Crea la clave en Configuración si no existe (0 = desactivado, no cambia nada hasta que el admin la ponga). */
export const ensureTrialSetting = async () => {
  await prisma.systemSetting.upsert({
    where: { key: TRIAL_DAYS_KEY },
    update: {},
    create: {
      key: TRIAL_DAYS_KEY,
      value: '0',
      group: 'general',
      isPublic: true,
      description: 'Días de prueba gratis para vendedores nuevos (0 = sin prueba)',
    },
  });
};

/** Campos del perfil de vendedor para una prueba de `days` días que empieza en `from`. */
export const trialProfileData = (days: number, from: Date = new Date()) => {
  const end = new Date(from.getTime() + days * DAY_MS);
  return { planActive: true, planId: null, isTrial: true, planExpiryDate: end, trialEndsAt: end };
};

/** Campos de perfil para un vendedor recién registrado según la configuración. */
export const newSellerPlanData = async () => {
  const days = await getTrialDays();
  return days > 0 ? trialProfileData(days) : { planActive: false, planExpiryDate: null };
};

/**
 * Cierra las pruebas vencidas (de un usuario o de todos). Solo toca pruebas, nunca planes pagos.
 * Devuelve cuántas se cerraron.
 */
export const expireTrials = async (userId?: string): Promise<number> => {
  const now = new Date();
  const expired = await prisma.sellerProfile.findMany({
    where: { isTrial: true, planActive: true, planExpiryDate: { lt: now }, ...(userId ? { userId } : {}) },
    select: { id: true, userId: true },
  });
  if (!expired.length) return 0;

  await prisma.sellerProfile.updateMany({
    where: { id: { in: expired.map((p) => p.id) }, isTrial: true, planActive: true },
    data: { planActive: false, isTrial: false },
  });

  for (const p of expired) {
    sendPushToUser(p.userId, {
      title: 'Tu prueba gratis terminó',
      body: 'Elegí un plan para seguir usando tu tienda, el POS y vender online.',
      url: '/vendedor/planes',
      tag: 'warning',
    }).catch(() => {});
  }
  console.log(`[prueba] ${expired.length} prueba(s) gratis vencida(s)`);
  return expired.length;
};

let timer: ReturnType<typeof setInterval> | null = null;

export const startTrialScheduler = (intervalMs = 60 * 60 * 1000) => {
  if (timer) return;
  const run = () => expireTrials().catch((e) => console.error('[prueba] vencimientos', e));
  setTimeout(run, 30_000);
  timer = setInterval(run, intervalMs);
};
