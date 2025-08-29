import { api } from './api';
import type { CreateTransactionDto, UpdateTransactionDto, TransactionFilters } from '../types';

export const transactionService = {
  async getAll(filters?: TransactionFilters) {
    try {
      // Convert Date objects to ISO strings for API and filter out undefined values
      let processedFilters: Record<string, any> = {};
      
      if (filters) {
        // Only add properties that have defined values
        Object.keys(filters).forEach(key => {
          const value = (filters as any)[key];
          if (value !== undefined && value !== null) {
            if (key === 'startDate' || key === 'endDate') {
              processedFilters[key] = value instanceof Date ? value.toISOString() : value;
            } else {
              processedFilters[key] = value;
            }
          }
        });
      }
      
      const { data } = await api.get('/transactions', { 
        params: Object.keys(processedFilters).length > 0 ? processedFilters : undefined 
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      console.error('Request config:', error.config);
      console.error('Response data:', error.response?.data);
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
  },

  async searchPayees(query: string) {
    try {
      const { data } = await api.get(`/transactions/search-payees?q=${encodeURIComponent(query)}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pagantes:', error);
      // Retorna array vazio em caso de erro para não quebrar a UI
      return [];
    }
  }
};