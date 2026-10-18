/**
 * La tienda puede vender online: plan con "Tienda Online" que no sea el Básico, o cobro por comisión
 * activo (sin plan fijo). Misma regla que el servidor (server/src/utils/plans.ts).
 */
export const sellerAllowsOnlineSales = (seller: {
  plan?: { name: string; features?: string[] } | null;
  planId?: string | null;
  planActive?: boolean | null;
} | null | undefined): boolean => {
  if (!seller) return false;
  if (seller.plan) {
    const name = (seller.plan.name || '').toLowerCase();
    if (name.includes('básico') || name.includes('basic')) return false;
    return (seller.plan.features || []).some((f) => f.toLowerCase().includes('tienda online'));
  }
  return !seller.planId && !!seller.planActive;
};
