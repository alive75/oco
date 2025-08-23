import { api } from './api';

export interface Transaction {
  id: number;
  date: string;
  payee: string;
  amount: number;
  isShared: boolean;
  notes?: string;
  accountId: number;
  categoryId?: number;
  paidBy: number;
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
  async getAll(filters?: TransactionFilters) {
    try {
      const { data } = await api.get('/transactions', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  },
  
  async create(dto: CreateTransactionDto) {
    try {
      const { data } = await api.post('/transactions', dto);
      return data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  },
  
  async update(id: number, dto: UpdateTransactionDto) {
    try {
      const { data } = await api.patch(`/transactions/${id}`, dto);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  },
  
  async delete(id: number) {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
  }
};