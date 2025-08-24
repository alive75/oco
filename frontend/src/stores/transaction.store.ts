import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { transactionService } from '../services/transaction.service';
import type { Transaction, CreateTransactionDto, UpdateTransactionDto, TransactionFilters } from '../types';
import { useBudgetStore } from './budget.store';

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
    
    // Update budget if transaction has a category
    if (dto.categoryId) {
      const budgetStore = useBudgetStore.getState();
      budgetStore.loadBudget();
    }
  },
  
  updateTransaction: async (id, dto) => {
    const updatedTransaction = await transactionService.update(id, dto);
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id ? updatedTransaction : transaction
      ),
    }));
    
    // Update budget if transaction had/has a category
    if (dto.categoryId !== undefined) {
      const budgetStore = useBudgetStore.getState();
      budgetStore.loadBudget();
    }
  },
  
  deleteTransaction: async (id) => {
    const transaction = get().transactions.find(t => t.id === id);
    await transactionService.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));

    // Update budget if transaction had a category
    if (transaction?.categoryId) {
      const budgetStore = useBudgetStore.getState();
      budgetStore.loadBudget();
    }
  },
    }),
    {
      name: 'transaction-filters',
      // Only persist filters, not transactions or loading state
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);