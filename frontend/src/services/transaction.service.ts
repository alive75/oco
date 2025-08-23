import { api } from './api';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionFilters } from '../types';

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