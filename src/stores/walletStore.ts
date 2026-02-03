import { create } from 'zustand';
import type { Wallet, Transaction, TransactionType } from '@/types';
import { mockWallets, mockTransactions, getWalletByUserId, getTransactionsByWalletId } from '@/data/mockData';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (walletId: string) => Promise<void>;
  transfer: (fromUserId: string, toUserId: string, amount: number, description?: string) => Promise<boolean>;
  requestWithdrawal: (userId: string, amount: number) => Promise<boolean>;
  deposit: (userId: string, amount: number, description?: string) => Promise<boolean>;
  purchase: (userId: string, amount: number, description: string, orderId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const wallet = getWalletByUserId(userId);
    
    if (wallet) {
      set({ wallet, isLoading: false });
    } else {
      set({ isLoading: false, error: 'Billetera no encontrada' });
    }
  },

  fetchTransactions: async (walletId: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const transactions = getTransactionsByWalletId(walletId);
    
    set({ 
      transactions: transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      isLoading: false 
    });
  },

  transfer: async (fromUserId: string, toUserId: string, amount: number, description?: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const fromWallet = getWalletByUserId(fromUserId);
    const toWallet = getWalletByUserId(toUserId);
    
    if (!fromWallet || !toWallet) {
      set({ isLoading: false, error: 'Billetera no encontrada' });
      return false;
    }
    
    if (fromWallet.balance < amount) {
      set({ isLoading: false, error: 'Saldo insuficiente' });
      return false;
    }
    
    // Actualizar balances
    fromWallet.balance -= amount;
    fromWallet.totalOut += amount;
    fromWallet.updatedAt = new Date();
    
    toWallet.balance += amount;
    toWallet.totalIn += amount;
    toWallet.updatedAt = new Date();
    
    // Crear transacciones
    const outTransaction: Transaction = {
      id: `trans-${Date.now()}-out`,
      walletId: fromWallet.id,
      userId: fromUserId,
      type: 'transfer_out',
      amount: -amount,
      currency: 'PYG',
      description: description || `Transferencia a ${toUserId}`,
      status: 'completed',
      relatedUserId: toUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const inTransaction: Transaction = {
      id: `trans-${Date.now()}-in`,
      walletId: toWallet.id,
      userId: toUserId,
      type: 'transfer_in',
      amount: amount,
      currency: 'PYG',
      description: description || `Transferencia de ${fromUserId}`,
      status: 'completed',
      relatedUserId: fromUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockTransactions.push(outTransaction, inTransaction);
    
    // Actualizar estado si es la wallet actual
    const { wallet } = get();
    if (wallet?.id === fromWallet.id) {
      set({ 
        wallet: fromWallet,
        transactions: [outTransaction, ...get().transactions]
      });
    }
    
    set({ isLoading: false });
    return true;
  },

  requestWithdrawal: async (userId: string, amount: number) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const wallet = getWalletByUserId(userId);
    
    if (!wallet) {
      set({ isLoading: false, error: 'Billetera no encontrada' });
      return false;
    }
    
    if (wallet.balance < amount) {
      set({ isLoading: false, error: 'Saldo insuficiente' });
      return false;
    }
    
    // Crear transacción de retiro pendiente
    const withdrawalTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      walletId: wallet.id,
      userId: userId,
      type: 'withdrawal',
      amount: -amount,
      currency: 'PYG',
      description: 'Solicitud de retiro',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockTransactions.push(withdrawalTransaction);
    
    set({ isLoading: false });
    return true;
  },

  deposit: async (userId: string, amount: number, description?: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const wallet = getWalletByUserId(userId);
    
    if (!wallet) {
      set({ isLoading: false, error: 'Billetera no encontrada' });
      return false;
    }
    
    // Actualizar balance
    wallet.balance += amount;
    wallet.totalIn += amount;
    wallet.updatedAt = new Date();
    
    // Crear transacción
    const depositTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      walletId: wallet.id,
      userId: userId,
      type: 'deposit',
      amount: amount,
      currency: 'PYG',
      description: description || 'Depósito',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockTransactions.push(depositTransaction);
    
    // Actualizar estado
    const { wallet: currentWallet } = get();
    if (currentWallet?.id === wallet.id) {
      set({ 
        wallet,
        transactions: [depositTransaction, ...get().transactions]
      });
    }
    
    set({ isLoading: false });
    return true;
  },

  purchase: async (userId: string, amount: number, description: string, orderId: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const wallet = getWalletByUserId(userId);
    
    if (!wallet) {
      set({ isLoading: false, error: 'Billetera no encontrada' });
      return false;
    }
    
    if (wallet.balance < amount) {
      set({ isLoading: false, error: 'Saldo insuficiente' });
      return false;
    }
    
    // Actualizar balance
    wallet.balance -= amount;
    wallet.totalOut += amount;
    wallet.updatedAt = new Date();
    
    // Crear transacción
    const purchaseTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      walletId: wallet.id,
      userId: userId,
      type: 'purchase',
      amount: -amount,
      currency: 'PYG',
      description,
      status: 'completed',
      relatedOrderId: orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockTransactions.push(purchaseTransaction);
    
    // Actualizar estado
    const { wallet: currentWallet } = get();
    if (currentWallet?.id === wallet.id) {
      set({ 
        wallet,
        transactions: [purchaseTransaction, ...get().transactions]
      });
    }
    
    set({ isLoading: false });
    return true;
  },

  clearError: () => {
    set({ error: null });
  },
}));
