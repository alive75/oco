import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { budgetService } from '../services/budget.service';
import { cache, cacheKeys } from '../utils/cache';
import type { BudgetGroup, CreateGroupDto, CreateCategoryDto, UpdateCategoryDto, MonthlyBudget } from '../types';

interface BudgetState {
  currentMonth: Date;
  groups: BudgetGroup[];
  readyToAssign: number;
  readyToAssignTransactions: any[];
  isLoading: boolean;
  
  // Actions
  setCurrentMonth: (month: Date) => void;
  loadBudget: (month?: Date) => Promise<void>;
  loadReadyToAssignTransactions: (month?: Date) => Promise<void>;
  updateCategory: (categoryId: number, dto: UpdateCategoryDto) => Promise<void>;
  createGroup: (dto: CreateGroupDto) => Promise<void>;
  updateGroup: (id: number, dto: Partial<CreateGroupDto>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  createCategory: (dto: CreateCategoryDto) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
  currentMonth: new Date(),
  groups: [],
  readyToAssign: 0,
  readyToAssignTransactions: [],
  isLoading: false,
  
  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().loadBudget(month);
    get().loadReadyToAssignTransactions(month);
  },
  
  loadBudget: async (month) => {
    const targetMonth = month || get().currentMonth;
    const cacheKey = cacheKeys.budget(targetMonth);
    
    // Check cache first
    const cachedBudget = cache.get<MonthlyBudget>(cacheKey);
    if (cachedBudget) {
      set({
        groups: cachedBudget.groups,
        readyToAssign: cachedBudget.readyToAssign,
        currentMonth: targetMonth,
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true });
    try {
      const budget: MonthlyBudget = await budgetService.getMonthlyBudget(targetMonth);
      
      // Calculate totalAllocated for each group if missing from backend
      const processedGroups = budget.groups.map(group => {
        if (!group.totalAllocated && group.totalAllocated !== 0) {
          const totalAllocated = group.categories.reduce((sum, category) => {
            const amount = typeof category.allocatedAmount === 'string' 
              ? parseFloat(category.allocatedAmount) 
              : category.allocatedAmount;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          return { ...group, totalAllocated };
        }
        return group;
      });
      
      // Cache the result for 5 minutes
      cache.set(cacheKey, budget, 5);
      
      set({
        groups: processedGroups,
        readyToAssign: budget.readyToAssign,
        currentMonth: targetMonth,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadReadyToAssignTransactions: async (month) => {
    const targetMonth = month || get().currentMonth;
    try {
      const data = await budgetService.getReadyToAssignTransactions(targetMonth);
      set({ readyToAssignTransactions: data.transactions || [] });
    } catch (error) {
      console.error('Erro ao carregar transações Pronto para Atribuir:', error);
      set({ readyToAssignTransactions: [] });
    }
  },
  
  updateCategory: async (categoryId, dto) => {
    await budgetService.updateCategory(categoryId, dto);
    // Invalidate cache and reload budget
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
    get().loadReadyToAssignTransactions();
  },
  
  createGroup: async (dto) => {
    await budgetService.createGroup(dto);
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
  },

  updateGroup: async (id, dto) => {
    await budgetService.updateGroup(id, dto);
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
  },

  deleteGroup: async (id) => {
    await budgetService.deleteGroup(id);
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
  },
  
  createCategory: async (dto) => {
    await budgetService.createCategory(dto);
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
  },

  deleteCategory: async (id) => {
    await budgetService.deleteCategory(id);
    const currentMonth = get().currentMonth;
    cache.invalidate(cacheKeys.budget(currentMonth));
    get().loadBudget();
  },
    }),
    {
      name: 'budget-preferences',
      // Only persist currentMonth
      partialize: (state) => ({ currentMonth: state.currentMonth }),
    }
  )
);