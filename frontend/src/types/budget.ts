export interface BudgetCategory {
  id: number;
  name: string;
  allocated_amount: number;
  spent: number;
  available: number;
  group_id: number;
}

export interface BudgetGroup {
  id: number;
  name: string;
  month_year: string;
  categories: BudgetCategory[];
  total_allocated: number;
}

export interface MonthlyBudget {
  groups: BudgetGroup[];
  readyToAssign: number;
  monthYear: string;
}

export interface CreateGroupDto {
  name: string;
  month_year: string;
}

export interface CreateCategoryDto {
  name: string;
  allocated_amount: number;
  group_id: number;
}

export interface UpdateCategoryDto {
  name?: string;
  allocated_amount?: number;
}

export interface UpdateGroupDto {
  name?: string;
}