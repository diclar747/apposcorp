import { create } from 'zustand';
import type { Product } from '@/types';
import { mockProducts, mockStores } from '@/data/mockData';
import { productsApi } from '@/lib/api';

interface ProductState {
  products: Product[];
  isLoaded: boolean;

  // Actions
  loadProducts: (sellerId: string) => Promise<void>;
  getProductsForStore: (sellerId: string) => Product[];
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addProduct: (product: Product) => void;
  toggleStatus: (id: string) => void;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isLoaded: false,

  loadProducts: async (sellerId: string) => {
    // If already loaded, skip
    if (get().isLoaded) return;

    try {
      const data = await productsApi.getAll({ sellerId });
      if (data && data.length > 0) {
        set({ products: data, isLoaded: true });
        return;
      }
    } catch {
      // API not available
    }

    // Fallback to mock data - load ALL mock products (not just one seller)
    // so that switching sellers or viewing store pages works correctly
    set({ products: [...mockProducts], isLoaded: true });
  },

  getProductsForStore: (sellerId: string) => {
    const store = mockStores.find(s => s.sellerId === sellerId);
    if (!store) {
      return get().products.filter(p => p.sellerId === sellerId);
    }
    return get().products.filter(p => p.storeId === store.id);
  },

  updateProduct: (id: string, data: Partial<Product>) => {
    // Try API in background
    productsApi.update(id, data).catch(() => {});

    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
      ),
    }));
  },

  deleteProduct: (id: string) => {
    // Try API in background
    productsApi.delete(id).catch(() => {});

    set(state => ({
      products: state.products.filter(p => p.id !== id),
    }));
  },

  addProduct: (product: Product) => {
    // Try API in background
    productsApi.create(product).catch(() => {});

    set(state => ({
      products: [...state.products, product],
    }));
  },

  toggleStatus: (id: string) => {
    const product = get().products.find(p => p.id === id);
    if (!product) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    // Try API in background
    productsApi.update(id, { status: newStatus }).catch(() => {});

    set(state => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, status: newStatus } : p
      ),
    }));
  },
}));
