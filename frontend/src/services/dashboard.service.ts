import api from './api';

interface DashboardSummary {
  readyToAssign: number;
  totalBalance: number;
  sharedExpenses: number;
}

interface RecentTransaction {
  id: number;
  date: string;
  payee: string;
  amount: number;
  accountName: string;
  categoryName?: string;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const response = await api.get('/reports/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      return {
        readyToAssign: 0,
        totalBalance: 0,
        sharedExpenses: 0
      };
    }
  },

  async getRecentTransactions(): Promise<RecentTransaction[]> {
    try {
      const response = await api.get('/reports/recent-transactions?limit=5');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações recentes:', error);
      return [];
    }
  }
};