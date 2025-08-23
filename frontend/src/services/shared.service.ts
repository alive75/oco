import { api } from './api';
import type { SharedBalance, SharedTransaction } from '../types';

export const sharedService = {
  async getMonthlyBalance(month: Date): Promise<SharedBalance> {
    const { data } = await api.get<SharedBalance>('/shared/balance', {
      params: { month: month.toISOString() },
    });
    return data;
  },

  async getSharedTransactions(month: Date): Promise<SharedTransaction[]> {
    const { data } = await api.get<SharedTransaction[]>('/shared/transactions', {
      params: { month: month.toISOString() },
    });
    return data;
  },

  async settle(month: Date): Promise<void> {
    await api.post('/shared/settle', { month: month.toISOString() });
  },
};