import { create } from 'zustand';
import { budgetService } from '../services/budget.service';
import type { BudgetGroup, CreateGroupDto, CreateCategoryDto, UpdateCategoryDto, MonthlyBudget } from '../types';

interface BudgetState {
  currentMonth: Date;
  groups: BudgetGroup[];
  readyToAssign: number;
  isLoading: boolean;
  
  // Actions
  setCurrentMonth: (month: Date) => void;
  loadBudget: (month?: Date) => Promise<void>;
  updateCategory: (categoryId: number, dto: UpdateCategoryDto) => Promise<void>;
  createGroup: (dto: CreateGroupDto) => Promise<void>;
  updateGroup: (id: number, dto: Partial<CreateGroupDto>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  createCategory: (dto: CreateCategoryDto) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  currentMonth: new Date(),
  groups: [],
  readyToAssign: 0,
  isLoading: false,
  
  setCurrentMonth: (month) => {
    set({ currentMonth: month });
    get().loadBudget(month);
  },
  
  loadBudget: async (month) => {
    const targetMonth = month || get().currentMonth;
    set({ isLoading: true });
    try {
      const budget: MonthlyBudget = await budgetService.getMonthlyBudget(targetMonth);
      set({
        groups: budget.groups,
        readyToAssign: budget.readyToAssign,
        currentMonth: targetMonth,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateCategory: async (categoryId, dto) => {
    await budgetService.updateCategory(categoryId, dto);
    // Reload budget to get updated calculations
    get().loadBudget();
  },
  
  createGroup: async (dto) => {
    await budgetService.createGroup(dto);
    get().loadBudget();
  },

  updateGroup: async (id, dto) => {
    await budgetService.updateGroup(id, dto);
    get().loadBudget();
  },

  deleteGroup: async (id) => {
    await budgetService.deleteGroup(id);
    get().loadBudget();
  },
  
  createCategory: async (dto) => {
    await budgetService.createCategory(dto);
    get().loadBudget();
  },

  deleteCategory: async (id) => {
    await budgetService.deleteCategory(id);
    get().loadBudget();
  },
}));