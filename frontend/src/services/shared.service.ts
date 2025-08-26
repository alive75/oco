import { api } from './api';
import type { SharedBalance, SharedTransaction } from '../types';

export const sharedService = {
  async getMonthlyBalance(month: Date): Promise<SharedBalance> {
    const validDate = new Date(month);
    const { data } = await api.get<SharedBalance>('/shared/balance', {
      params: { month: validDate.toISOString() },
    });
    return data;
  },

  async getSharedTransactions(month: Date): Promise<SharedTransaction[]> {
    const validDate = new Date(month);
    const { data } = await api.get<SharedTransaction[]>('/shared/transactions', {
      params: { month: validDate.toISOString() },
    });
    return data;
  },

  async settle(month: Date): Promise<void> {
    const validDate = new Date(month);
    await api.post('/shared/settle', { month: validDate.toISOString() });
  },
};