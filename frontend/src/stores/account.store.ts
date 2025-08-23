import { create } from 'zustand';
import { accountService } from '../services/account.service';
import type { Account, CreateAccountDto, UpdateAccountDto } from '../types';

interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  isLoading: boolean;
  
  // Actions
  loadAccounts: () => Promise<void>;
  selectAccount: (account: Account | null) => void;
  createAccount: (dto: CreateAccountDto) => Promise<void>;
  updateAccount: (id: number, dto: UpdateAccountDto) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  
  loadAccounts: async () => {
    set({ isLoading: true });
    try {
      const accounts = await accountService.getAll();
      set({ accounts, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectAccount: (account) => {
    set({ selectedAccount: account });
  },
  
  createAccount: async (dto) => {
    const newAccount = await accountService.create(dto);
    set((state) => ({
      accounts: [...state.accounts, newAccount],
    }));
  },
  
  updateAccount: async (id, dto) => {
    const updatedAccount = await accountService.update(id, dto);
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? updatedAccount : account
      ),
      selectedAccount: state.selectedAccount?.id === id ? updatedAccount : state.selectedAccount,
    }));
  },
  
  deleteAccount: async (id) => {
    await accountService.delete(id);
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      selectedAccount: state.selectedAccount?.id === id ? null : state.selectedAccount,
    }));
  },
}));