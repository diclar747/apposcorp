/**
 * La tienda puede vender online: plan con "Tienda Online" que no sea el Básico.
 * Misma regla que usan las pantallas (StorePage, client/Store, client/Product).
 */
export const planAllowsOnlineSales = (plan: { name: string; features: string[] } | null | undefined): boolean => {
  if (!plan) return false;
  const name = (plan.name || '').toLowerCase();
  if (name.includes('básico') || name.includes('basic')) return false;
  return (plan.features || []).some((f) => f.toLowerCase().includes('tienda online'));
};
