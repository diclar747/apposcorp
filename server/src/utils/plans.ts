/**
 * La tienda puede vender online: plan con "Tienda Online" que no sea el Básico, o cobro por comisión
 * activo (sin plan fijo: planId vacío y planActive). Misma regla que usan las pantallas (src/lib/plans.ts).
 */
export const planAllowsOnlineSales = (plan: { name: string; features: string[] } | null | undefined): boolean => {
  if (!plan) return false;
  const name = (plan.name || '').toLowerCase();
  if (name.includes('básico') || name.includes('basic')) return false;
  return (plan.features || []).some((f) => f.toLowerCase().includes('tienda online'));
};

export const sellerAllowsOnlineSales = (seller: {
  plan?: { name: string; features: string[] } | null;
  planId?: string | null;
  planActive?: boolean | null;
}): boolean => (seller.plan ? planAllowsOnlineSales(seller.plan) : !seller.planId && !!seller.planActive);
