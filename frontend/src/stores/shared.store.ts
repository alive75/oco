import { create } from 'zustand';
import { sharedService, SharedBalance } from '@/services/shared.service';
import { Transaction } from '@/services/transaction.service';

interface SharedState {
  currentMonth: Date;
  balance: SharedBalance | null;
  sharedTransactions: Transaction[];
  isLoading: boolean;
  
  // Actions
  setCurrentMonth: (month: Date) => void;
  loadMonthlyData: (month?: Date) => Promise<void>;
  loadBalance: (month?: Date) => Promise<void>;
  loadSharedTransactions: (month?: Date) => Promise<void>;
  settle: (month?: Date) => Promise<void>;
}

export const useSharedStore = create<SharedState>((set, get) => ({
  currentMonth: new Date(),
  balance: null,
  sharedTransactions: [],
  isLoading: false,
  
  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().loadMonthlyData(month);
  },
  
  loadMonthlyData: async (month) => {
    const targetMonth = month || get().currentMonth;
    await Promise.all([
      get().loadBalance(targetMonth),
      get().loadSharedTransactions(targetMonth),
    ]);
  },
  
  loadBalance: async (month) => {
    const targetMonth = month || get().currentMonth;
    set({ isLoading: true });
    try {
      const balance = await sharedService.getMonthlyBalance(targetMonth);
      set({ balance, currentMonth: targetMonth, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  loadSharedTransactions: async (month) => {
    const targetMonth = month || get().currentMonth;
    try {
      const sharedTransactions = await sharedService.getSharedTransactions(targetMonth);
      set({ sharedTransactions, currentMonth: targetMonth });
    } catch (error) {
      throw error;
    }
  },
  
  settle: async (month) => {
    const targetMonth = month || get().currentMonth;
    await sharedService.settle(targetMonth);
    // Reload data after settling
    get().loadMonthlyData(targetMonth);
  },
}));