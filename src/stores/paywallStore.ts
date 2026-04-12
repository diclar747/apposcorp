import { create } from 'zustand';

interface PaywallState {
  isOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  isOpen: false,
  openPaywall: () => set({ isOpen: true }),
  closePaywall: () => set({ isOpen: false }),
}));
