import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { transactionService } from '../services/transaction.service';
import type { Transaction, CreateTransactionDto, UpdateTransactionDto, TransactionFilters } from '../types';
import { useBudgetStore } from './budget.store';
import { cache, cacheKeys } from '../utils/cache';

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilters;
  isLoading: boolean;
  
  // Actions
  loadTransactions: (filters?: TransactionFilters) => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  addTransaction: (dto: CreateTransactionDto) => Promise<void>;
  updateTransaction: (id: number, dto: UpdateTransactionDto) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  clearFilters: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
  transactions: [],
  filters: {},
  isLoading: false,
  
  loadTransactions: async (newFilters) => {
    const filters = newFilters || get().filters;
    set({ isLoading: true });
    try {
      const transactions = await transactionService.getAll(filters);
      set({ transactions, isLoading: false, filters });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  setFilters: (filters) => {
    set({ filters });
    get().loadTransactions();
  },

  clearFilters: () => {
    set({ filters: {} });
    get().loadTransactions();
  },
  
  addTransaction: async (dto) => {
    const newTransaction = await transactionService.create(dto);
    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
    
    // Invalidate accounts cache since balance changed
    cache.invalidate(cacheKeys.accounts());
    
    // Always update budget since any transaction can affect Ready to Assign
    const budgetStore = useBudgetStore.getState();
    const currentMonth = budgetStore.currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    budgetStore.loadBudget();
    budgetStore.loadReadyToAssignTransactions();
  },
  
  updateTransaction: async (id, dto) => {
    const updatedTransaction = await transactionService.update(id, dto);
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id ? updatedTransaction : transaction
      ),
    }));
    
    // Invalidate accounts cache since balance changed
    cache.invalidate(cacheKeys.accounts());
    
    // Always update budget since any transaction can affect Ready to Assign
    const budgetStore = useBudgetStore.getState();
    const currentMonth = budgetStore.currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    budgetStore.loadBudget();
    budgetStore.loadReadyToAssignTransactions();
  },
  
  deleteTransaction: async (id) => {
    await transactionService.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));

    // Invalidate accounts cache since balance changed
    cache.invalidate(cacheKeys.accounts());

    // Always update budget since any transaction can affect Ready to Assign
    const budgetStore = useBudgetStore.getState();
    const currentMonth = budgetStore.currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    budgetStore.loadBudget();
    budgetStore.loadReadyToAssignTransactions();
  },
    }),
    {
      name: 'transaction-filters',
      // Only persist filters, not transactions or loading state
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);