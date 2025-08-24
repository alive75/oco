import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sharedService } from '../services/shared.service';
import type { SharedBalance, SharedTransaction } from '../types';

interface SharedState {
  currentMonth: Date;
  balance: SharedBalance | null;
  sharedTransactions: SharedTransaction[];
  isLoading: boolean;
  
  // Actions
  setCurrentMonth: (month: Date) => void;
  loadMonthlyData: (month?: Date) => Promise<void>;
  loadBalance: (month?: Date) => Promise<void>;
  loadSharedTransactions: (month?: Date) => Promise<void>;
  settle: (month?: Date) => Promise<void>;
}

export const useSharedStore = create<SharedState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'shared-preferences',
      // Only persist currentMonth
      partialize: (state) => ({ currentMonth: state.currentMonth }),
    }
  )
);