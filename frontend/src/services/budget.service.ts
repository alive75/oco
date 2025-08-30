import { api } from './api';
import type { CreateGroupDto, CreateCategoryDto, UpdateCategoryDto, UpdateGroupDto } from '../types';

export const budgetService = {
  async getMonthlyBudget(month: Date) {
    try {
      const validDate = new Date(month);
      const { data } = await api.get('/budgets', {
        params: { month: validDate.toISOString() }
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar orçamento mensal:', error);
      throw error;
    }
  },

  async createCategory(dto: CreateCategoryDto) {
    try {
      const { data } = await api.post('/budgets/categories', dto);
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    try {
      const { data } = await api.patch(`/budgets/categories/${id}`, dto);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  },

  async createGroup(dto: CreateGroupDto) {
    try {
      const { data } = await api.post('/budgets/groups', dto);
      return data;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      throw error;
    }
  },

  async updateGroup(id: number, dto: UpdateGroupDto) {
    try {
      const { data } = await api.patch(`/budgets/groups/${id}`, dto);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      throw error;
    }
  },

  async deleteGroup(id: number) {
    try {
      await api.delete(`/budgets/groups/${id}`);
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      throw error;
    }
  },

  async deleteCategory(id: number) {
    try {
      await api.delete(`/budgets/categories/${id}`);
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  },

  async getReadyToAssignTransactions(month: Date) {
    try {
      const validDate = new Date(month);
      const { data } = await api.get('/budgets/ready-to-assign', {
        params: { month: validDate.toISOString() }
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar transações Pronto para Atribuir:', error);
      throw error;
    }
  }
};