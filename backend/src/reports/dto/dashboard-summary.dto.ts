export interface DashboardSummaryDto {
  readyToAssign: number;
  totalBalance: number;
  sharedExpenses: number;
}

export interface RecentTransactionDto {
  id: number;
  date: Date;
  payee: string;
  amount: number;
  accountName: string;
  categoryName?: string;
}