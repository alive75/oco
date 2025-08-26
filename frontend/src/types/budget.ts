export interface BudgetCategory {
  id: number;
  name: string;
  allocatedAmount: number;
  spent: number;
  available: number;
  groupId: number;
}

export interface BudgetGroup {
  id: number;
  name: string;
  monthYear: string;
  categories: BudgetCategory[];
  totalAllocated: number;
}

export interface MonthlyBudget {
  groups: BudgetGroup[];
  readyToAssign: number;
  monthYear: string;
}

export interface CreateGroupDto {
  name: string;
  monthYear: string;
}

export interface CreateCategoryDto {
  name: string;
  allocatedAmount: number;
  groupId: number;
}

export interface UpdateCategoryDto {
  name?: string;
  allocatedAmount?: number;
}

export interface UpdateGroupDto {
  name?: string;
}