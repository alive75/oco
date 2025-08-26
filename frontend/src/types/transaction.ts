export interface Transaction {
  id: number;
  accountId: number;
  categoryId?: number;
  amount: number;
  date: Date;
  payee: string;
  isShared: boolean;
  notes?: string;
  paidByUserId: number;
  type?: 'INCOME' | 'TRANSFER' | 'EXPENSE';
  account?: {
    name: string;
    type: string;
  };
  category?: {
    name: string;
  };
  user?: {
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  accountId: number;
  categoryId?: number;
  amount: number;
  date: Date;
  payee: string;
  isShared: boolean;
  notes?: string;
  type?: 'INCOME' | 'TRANSFER' | 'EXPENSE';
}

export interface UpdateTransactionDto {
  accountId?: number;
  categoryId?: number;
  amount?: number;
  date?: Date;
  payee?: string;
  isShared?: boolean;
  notes?: string;
  type?: 'INCOME' | 'TRANSFER' | 'EXPENSE';
}

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  isShared?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  userId?: number;
}