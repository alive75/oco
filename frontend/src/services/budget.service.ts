import api from './api';

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
  async getMonthlyBudget(month: Date): Promise<MonthlyBudget> {
    const { data } = await api.get<MonthlyBudget>('/budgets', {
      params: { month: month.toISOString() },
    });
    return data;
  },

  async createGroup(dto: CreateGroupDto): Promise<BudgetGroup> {
    const { data } = await api.post<BudgetGroup>('/budgets/groups', dto);
    return data;
  },

  async updateGroup(id: number, dto: Partial<CreateGroupDto>): Promise<BudgetGroup> {
    const { data } = await api.patch<BudgetGroup>(`/budgets/groups/${id}`, dto);
    return data;
  },

  async deleteGroup(id: number): Promise<void> {
    await api.delete(`/budgets/groups/${id}`);
  },

  async createCategory(dto: CreateCategoryDto): Promise<BudgetCategory> {
    const { data } = await api.post<BudgetCategory>('/budgets/categories', dto);
    return data;
  },

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<BudgetCategory> {
    const { data } = await api.patch<BudgetCategory>(`/budgets/categories/${id}`, dto);
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/budgets/categories/${id}`);
  },
};