import { api } from './api';

export interface BudgetCategory {
  id: number;
  name: string;
  allocatedAmount: number;
  spent?: number;
  available?: number;
}

export interface BudgetGroup {
  id: number;
  name: string;
  monthYear: Date;
  categories: BudgetCategory[];
}

export interface MonthlyBudget {
  groups: BudgetGroup[];
  readyToAssign: number;
  totalIncome: number;
  totalAllocated: number;
}

export interface CreateGroupDto {
  name: string;
  monthYear: Date;
}

export interface CreateCategoryDto {
  name: string;
  allocatedAmount: number;
  groupId: number;
}

export interface UpdateCategoryDto {
  allocatedAmount?: number;
  name?: string;
}

export const budgetService = {
  async getMonthlyBudget(month: Date) {
    try {
      const { data } = await api.get('/budgets', {
        params: { month: month.toISOString() }
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar orçamento mensal:', error);
      throw error;
    }
  },

  async createCategory(dto: CreateCategoryDto) {
    try {
      const { data } = await api.post('/budgets/categories', dto);
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    try {
      const { data } = await api.patch(`/budgets/categories/${id}`, dto);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }
};