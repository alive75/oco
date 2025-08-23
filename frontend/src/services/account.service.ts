import { api } from './api';
import type { Account, CreateAccountDto, UpdateAccountDto } from '../types';

export const accountService = {
  async getAll(): Promise<Account[]> {
    const { data } = await api.get<Account[]>('/accounts');
    return data;
  },

  async getById(id: number): Promise<Account> {
    const { data } = await api.get<Account>(`/accounts/${id}`);
    return data;
  },

  async create(dto: CreateAccountDto): Promise<Account> {
    const { data } = await api.post<Account>('/accounts', dto);
    return data;
  },

  async update(id: number, dto: UpdateAccountDto): Promise<Account> {
    const { data } = await api.patch<Account>(`/accounts/${id}`, dto);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
};