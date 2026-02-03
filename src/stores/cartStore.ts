import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  
  // Getters
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

      get total() {
        return get().items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      addItem: (product: Product, quantity: number) => {
        const { items } = get();
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          // Verificar stock
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > product.stock) {
            return; // No hay suficiente stock
          }
          
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item
            )
          });
        } else {
          if (quantity > product.stock) {
            return; // No hay suficiente stock
          }
          
          set({
            items: [...items, { product, quantity }]
          });
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter(item => item.product.id !== productId)
        });
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
        
        set({
          items: items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
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
    }
  )
);
