import api from './api';
import { Account } from './account.service';
import { BudgetCategory } from './budget.service';
import { User } from './auth.service';

export interface Transaction {
  id: number;
  date: string;
  payee: string;
  amount: number;
  isShared: boolean;
  notes?: string;
  account: Account;
  category?: BudgetCategory;
  paidBy: User;
  createdAt: string;
}

export interface CreateTransactionDto {
  accountId: number;
  categoryId?: number;
  date: string;
  payee: string;
  amount: number;
  isShared: boolean;
  notes?: string;
}

export interface UpdateTransactionDto {
  categoryId?: number;
  date?: string;
  payee?: string;
  amount?: number;
  isShared?: boolean;
  notes?: string;
}

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  isShared?: boolean;
}

export const transactionService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/transactions', { 
      params: filters 
    });
    return data;
  },

  async getById(id: number): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/transactions', dto);
    return data;
  },

  async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await api.patch<Transaction>(`/transactions/${id}`, dto);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};