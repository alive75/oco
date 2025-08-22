import api from './api';
import { Transaction } from './transaction.service';

export interface SharedBalance {
  user1Paid: number;
  user2Paid: number;
  owedBy: number | null;
  amount: number;
}

export const sharedService = {
  async getMonthlyBalance(month: Date): Promise<SharedBalance> {
    const { data } = await api.get<SharedBalance>('/shared/balance', {
      params: { month: month.toISOString() },
    });
    return data;
  },

  async getSharedTransactions(month: Date): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/shared/transactions', {
      params: { month: month.toISOString() },
    });
    return data;
  },

  async settle(month: Date): Promise<void> {
    await api.post('/shared/settle', { month: month.toISOString() });
  },
};