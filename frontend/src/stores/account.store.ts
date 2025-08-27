import { create } from 'zustand';
import { accountService } from '../services/account.service';
import { cache, cacheKeys } from '../utils/cache';
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
    const cacheKey = cacheKeys.accounts();
    
    // Check cache first
    const cachedAccounts = cache.get<Account[]>(cacheKey);
    if (cachedAccounts) {
      set((state) => {
        // Update selectedAccount if it exists in the new accounts data
        const updatedSelectedAccount = state.selectedAccount 
          ? cachedAccounts.find(acc => acc.id === state.selectedAccount!.id) || state.selectedAccount
          : null;
        
        return { 
          accounts: cachedAccounts, 
          selectedAccount: updatedSelectedAccount,
          isLoading: false 
        };
      });
      return;
    }

    set({ isLoading: true });
    try {
      const accounts = await accountService.getAll();
      
      // Cache for 3 minutes (accounts don't change as frequently)
      cache.set(cacheKey, accounts, 3);
      
      set((state) => {
        // Update selectedAccount if it exists in the new accounts data
        const updatedSelectedAccount = state.selectedAccount 
          ? accounts.find(acc => acc.id === state.selectedAccount!.id) || state.selectedAccount
          : null;
        
        return { 
          accounts, 
          selectedAccount: updatedSelectedAccount,
          isLoading: false 
        };
      });
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
    // Invalidate cache
    cache.invalidate(cacheKeys.accounts());
    set((state) => ({
      accounts: [...state.accounts, newAccount],
    }));
  },
  
  updateAccount: async (id, dto) => {
    const updatedAccount = await accountService.update(id, dto);
    // Invalidate cache
    cache.invalidate(cacheKeys.accounts());
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? updatedAccount : account
      ),
      selectedAccount: state.selectedAccount?.id === id ? updatedAccount : state.selectedAccount,
    }));
  },
  
  deleteAccount: async (id) => {
    await accountService.delete(id);
    // Invalidate cache
    cache.invalidate(cacheKeys.accounts());
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      selectedAccount: state.selectedAccount?.id === id ? null : state.selectedAccount,
    }));
  },
}));