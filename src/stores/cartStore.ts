import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '@/types';

const recalc = (items: CartItem[]) => ({
  total: items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

interface CartState {
  items: CartItem[];

  // Computed values
  total: number;
  itemCount: number;

  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product: Product, quantity: number) => {
        // Validación global de Plan (Seguridad adicional)
        const sellerProfile = (product as any).seller?.sellerProfile || (product as any).sellerProfile;
        if (sellerProfile?.plan) {
          const features = sellerProfile.plan.features || [];
          const canPurchase = features.some((f: string) => f.toLowerCase().includes('tienda online'));
          if (!canPurchase) {
            return;
          }
        }

        const { items } = get();
        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          // Verificar stock
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > product.stock) {
            return; // No hay suficiente stock
          }

          const newItems = items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          );
          set({ items: newItems, ...recalc(newItems) });
        } else {
          if (quantity > product.stock) {
            return; // No hay suficiente stock
          }

          const newItems = [...items, { product, quantity }];
          set({ items: newItems, ...recalc(newItems) });
        }
      },

      removeItem: (productId: string) => {
        const newItems = get().items.filter(item => item.product.id !== productId);
        set({ items: newItems, ...recalc(newItems) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const { items } = get();
        const item = items.find(i => i.product.id === productId);

        if (item && quantity > item.product.stock) {
          return; // No hay suficiente stock
        }

        const newItems = items.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        set({ items: newItems, ...recalc(newItems) });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },

      isInCart: (productId: string) => {
        return get().items.some(item => item.product.id === productId);
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(i => i.product.id === productId);
        return item?.quantity || 0;
      },
    }),
    {
      name: 'oscorp-cart',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const computed = recalc(state.items);
          state.total = computed.total;
          state.itemCount = computed.itemCount;
        }
      },
    }
  )
);
