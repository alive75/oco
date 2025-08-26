import { useState, useEffect } from 'react';
import { useAccountStore } from '../../stores/account.store';
import { useTransactionStore } from '../../stores/transaction.store';
import { useBudgetStore } from '../../stores/budget.store';
import { AccountsSkeleton } from '../../components/Skeleton';
import { NoAccountsSelected, NoAccounts, NoTransactions, LoadingTransactions } from '../../components/EmptyStates';
import { useModalKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDebounce } from '../../hooks/useDebounce';
// import { useAuthStore } from '../../stores/auth.store';
import { formatCurrency } from '../../utils/currency';
import { 
  Plus as PlusIcon, 
  CreditCard as CreditCardIcon, 
  Building2 as BuildingLibraryIcon, 
  TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  Tag as TagIcon,
  // DollarSign as DollarSignIcon,
  Edit as EditIcon,
  Trash as TrashIcon,
  Search as SearchIcon
} from 'lucide-react';
import type { Account, CreateTransactionDto, CreateAccountDto } from '../../types';

export default function Accounts() {
  // const { user } = useAuthStore();
  const { accounts, selectedAccount, isLoading: accountsLoading, loadAccounts, selectAccount, createAccount } = useAccountStore();
  const { transactions, isLoading: transactionsLoading, loadTransactions, addTransaction, deleteTransaction } = useTransactionStore();
  const { groups } = useBudgetStore();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionForm, setTransactionForm] = useState<CreateTransactionDto>({
    accountId: 0,
    amount: 0,
    date: new Date(),
    payee: '',
    isShared: false,
    notes: ''
  });
  const [accountForm, setAccountForm] = useState<CreateAccountDto>({
    name: '',
    type: 'CHECKING',
    balance: 0
  });

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions({ accountId: selectedAccount.id });
    }
  }, [selectedAccount, loadTransactions]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'INVESTMENT':
        return <TrendingUpIcon className="h-5 w-5" />;
      default:
        return <BuildingLibraryIcon className="h-5 w-5" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'INVESTMENT':
        return 'Investimento';
      default:
        return 'Conta Corrente';
    }
  };

  const handleAccountSelect = (account: Account) => {
    selectAccount(account);
  };

  const openTransactionForm = (account?: Account) => {
    const targetAccount = account || selectedAccount;
    if (!targetAccount) return;
    
    setTransactionForm({
      accountId: targetAccount.id,
      amount: 0,
      date: new Date(),
      payee: '',
      isShared: false,
      notes: ''
    });
    // setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const validateTransactionForm = () => {
    const errors: string[] = [];
    
    // Validate date - not in future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const transactionDate = new Date(transactionForm.date);
    
    if (transactionDate > today) {
      errors.push('A data não pode ser no futuro');
    }
    
    // Validate payee
    if (!transactionForm.payee.trim()) {
      errors.push('O nome do pagante é obrigatório');
    } else if (transactionForm.payee.trim().length > 200) {
      errors.push('O nome do pagante não pode ter mais de 200 caracteres');
    }
    
    // Validate amount
    if (transactionForm.amount <= 0) {
      errors.push('O valor deve ser maior que zero');
    } else if (transactionForm.amount > 1000000) {
      errors.push('O valor não pode exceder R$ 1.000.000');
    }
    
    // Validate notes length
    if (transactionForm.notes && transactionForm.notes.length > 500) {
      errors.push('As anotações não podem ter mais de 500 caracteres');
    }
    
    return errors;
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateTransactionForm();
    if (errors.length > 0) {
      alert(`Erro de validação:\n\n${errors.join('\n')}`);
      return;
    }
    
    try {
      await addTransaction(transactionForm);
      setShowTransactionForm(false);
      // Reload accounts to update balances
      loadAccounts();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      alert('Erro ao criar transação. Tente novamente.');
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }
    
    try {
      await deleteTransaction(transactionId);
      // Reload accounts to update balances
      loadAccounts();
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountForm.name.trim()) {
      alert('O nome da conta é obrigatório');
      return;
    }
    
    try {
      await createAccount(accountForm);
      setShowAccountForm(false);
      setAccountForm({
        name: '',
        type: 'CHECKING',
        balance: 0
      });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta. Tente novamente.');
    }
  };

  const formatTransactionDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Get all categories from all groups for the select
  const allCategories = groups.flatMap(group => group.categories);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    if (!debouncedSearchQuery) return true;
    
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      transaction.payee.toLowerCase().includes(searchLower) ||
      transaction.category?.name.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower) ||
      formatCurrency(transaction.amount).toLowerCase().includes(searchLower)
    );
  });

  // Keyboard shortcuts for the modal
  useModalKeyboardShortcuts(
    () => {
      if (showTransactionForm) {
        document.getElementById('transaction-form-submit')?.click();
      }
    },
    () => {
      if (showTransactionForm) {
        setShowTransactionForm(false);
      }
    },
    showTransactionForm
  );

  if (accountsLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Contas</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAccountForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nova Conta</span>
          </button>
          <button
            onClick={() => openTransactionForm()}
            disabled={!selectedAccount}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Contas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Suas Contas</h2>
          
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedAccount?.id === account.id 
                  ? 'border-2 border-blue-500 bg-gray-700 transform scale-[1.02]' 
                  : 'hover:bg-gray-700 hover:transform hover:scale-[1.01]'
              }`}
              onClick={() => handleAccountSelect(account)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-400">
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{account.name}</h3>
                    <p className="text-sm text-gray-400">
                      {getAccountTypeLabel(account.type)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(account.balance)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <NoAccounts onAddAccount={() => setShowAccountForm(true)} />
          )}
        </div>

        {/* Detalhes da Conta e Transações */}
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <div className="space-y-6">
              {/* Header da Conta Selecionada */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400">
                      {getAccountIcon(selectedAccount.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedAccount.name}
                      </h2>
                      <p className="text-gray-400">
                        {getAccountTypeLabel(selectedAccount.type)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTransactionForm(selectedAccount)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">Saldo Atual</div>
                  <div className={`text-2xl font-bold ${
                    selectedAccount.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(selectedAccount.balance)}
                  </div>
                </div>
              </div>

              {/* Lista de Transações */}
              <div className="bg-gray-800 rounded-lg">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Transações Recentes</h3>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar transações..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-700">
                  {transactionsLoading ? (
                    <LoadingTransactions />
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 hover:bg-gray-700 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2 text-white font-medium">
                                <span>{transaction.payee}</span>
                                {transaction.isShared && (
                                  <span className="px-2 py-1 bg-blue-600 text-xs rounded">
                                    Compartilhada
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center space-x-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{formatTransactionDate(transaction.date)}</span>
                                </span>
                                {transaction.category && (
                                  <span className="flex items-center space-x-1">
                                    <TagIcon className="h-3 w-3" />
                                    <span>{transaction.category.name}</span>
                                  </span>
                                )}
                                {transaction.user && (
                                  <span className="flex items-center space-x-1">
                                    <UserIcon className="h-3 w-3" />
                                    <span>{transaction.user.name}</span>
                                  </span>
                                )}
                              </div>
                              {transaction.notes && (
                                <div className="text-sm text-gray-400 mt-1">
                                  {transaction.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`text-lg font-semibold ${
                              transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => console.log('Editar transação:', transaction.id)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-all duration-200"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : transactions.length > 0 && debouncedSearchQuery ? (
                    <div className="p-6 text-center text-gray-400">
                      <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium text-gray-300 mb-2">
                        Nenhuma transação encontrada
                      </h4>
                      <p className="text-gray-400 mb-4">
                        Nenhuma transação corresponde à busca "{debouncedSearchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        Limpar busca
                      </button>
                    </div>
                  ) : (
                    <NoTransactions onAddTransaction={() => openTransactionForm(selectedAccount)} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <NoAccountsSelected />
          )}
        </div>
      </div>

      {/* Modal de Formulário de Transação */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-white mb-4">
              Nova Transação
            </h3>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={transactionForm.date.toISOString().slice(0, 10)}
                  max={new Date().toISOString().slice(0, 10)} // Don't allow future dates
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    date: new Date(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Pagante
                </label>
                <input
                  type="text"
                  value={transactionForm.payee}
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    payee: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Supermercado, Restaurante..."
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={transactionForm.categoryId || ''}
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    categoryId: e.target.value ? Number(e.target.value) : undefined
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Selecione uma categoria (opcional)</option>
                  {allCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={transactionForm.isShared}
                    onChange={(e) => setTransactionForm({
                      ...transactionForm,
                      isShared: e.target.checked
                    })}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <span>Despesa compartilhada</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Anotações (opcional)
                </label>
                <textarea
                  value={transactionForm.notes || ''}
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    notes: e.target.value
                  })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  id="transaction-form-submit"
                  type="submit"
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors duration-200"
                >
                  Salvar <span className="text-xs opacity-70">(Ctrl+Enter)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors duration-200"
                >
                  Cancelar <span className="text-xs opacity-70">(Esc)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Formulário de Conta */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-white mb-4">
              Nova Conta
            </h3>
            
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({
                    ...accountForm,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Conta Corrente Principal, Cartão Nubank..."
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo da Conta
                </label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({
                    ...accountForm,
                    type: e.target.value as 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT'
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="INVESTMENT">Investimento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({
                    ...accountForm,
                    balance: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors duration-200"
                >
                  Criar Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountForm(false);
                    setAccountForm({
                      name: '',
                      type: 'CHECKING',
                      balance: 0
                    });
                  }}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}