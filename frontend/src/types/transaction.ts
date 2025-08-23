export interface Transaction {
  id: number;
  account_id: number;
  categoryId?: number;
  amount: number;
  date: Date;
  payee: string;
  is_shared: boolean;
  notes?: string;
  paid_by_user_id: number;
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
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionDto {
  account_id: number;
  categoryId?: number;
  amount: number;
  date: Date;
  payee: string;
  is_shared: boolean;
  notes?: string;
  type?: 'INCOME' | 'TRANSFER' | 'EXPENSE';
}

export interface UpdateTransactionDto {
  account_id?: number;
  categoryId?: number;
  amount?: number;
  date?: Date;
  payee?: string;
  is_shared?: boolean;
  notes?: string;
  type?: 'INCOME' | 'TRANSFER' | 'EXPENSE';
}

export interface TransactionFilters {
  account_id?: number;
  categoryId?: number;
  is_shared?: boolean;
  start_date?: Date;
  end_date?: Date;
  user_id?: number;
}