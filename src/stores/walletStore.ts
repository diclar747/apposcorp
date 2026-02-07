import { create } from 'zustand';
import type { Wallet, Transaction } from '@/types';
import { walletApi } from '@/lib/api';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (walletId: string) => Promise<void>;
  transfer: (fromUserId: string, toUserId: string, amount: number, description?: string, pin?: string) => Promise<boolean>;
  requestWithdrawal: (userId: string, amount: number) => Promise<boolean>;
  deposit: (userId: string, amount: number, description?: string) => Promise<boolean>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const wallet = await walletApi.getWallet();
      set({ wallet, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch wallet:', error);
      set({ isLoading: false, error: error.message || 'Error al obtener billetera' });
    }
  },

  fetchTransactions: async (walletId: string) => {
    set({ isLoading: true, error: null });

    try {
      const transactions = await walletApi.getTransactions({ limit: 200 });
      set({
        transactions,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      set({ isLoading: false, error: error.message || 'Error al obtener transacciones' });
    }
  },

  transfer: async (fromUserId: string, toUserId: string, amount: number, description?: string, pin?: string) => {
    set({ isLoading: true, error: null });

    try {
      await walletApi.transfer(toUserId, amount, description, pin);

      // Refresh wallet and transactions
      const { fetchWallet, fetchTransactions, wallet } = get();
      if (wallet) {
        await fetchWallet(wallet.userId);
        await fetchTransactions(wallet.id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Error en la transferencia' });
      return false;
    }
  },

  requestWithdrawal: async (userId: string, amount: number) => {
    set({ isLoading: true, error: null });

    try {
      await walletApi.withdraw(amount);

      // Refresh wallet and transactions
      const { fetchWallet, fetchTransactions, wallet } = get();
      if (wallet) {
        await fetchWallet(wallet.userId);
        await fetchTransactions(wallet.id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Error al solicitar retiro' });
      return false;
    }
  },

  deposit: async (userId: string, amount: number, description?: string) => {
    set({ isLoading: true, error: null });

    try {
      await walletApi.deposit(amount, description);

      // Refresh wallet and transactions
      const { fetchWallet, fetchTransactions, wallet } = get();
      if (wallet) {
        await fetchWallet(wallet.userId);
        await fetchTransactions(wallet.id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Error en el depósito' });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
