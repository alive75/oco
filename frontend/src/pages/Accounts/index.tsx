import { useState, useEffect } from 'react';
import { useAccountStore } from '../../stores/account.store';
import { useTransactionStore } from '../../stores/transaction.store';
import { useBudgetStore } from '../../stores/budget.store';
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
  Trash as TrashIcon
} from 'lucide-react';
import type { Account, CreateTransactionDto } from '../../types';

export default function Accounts() {
  // const { user } = useAuthStore();
  const { accounts, selectedAccount, isLoading: accountsLoading, loadAccounts, selectAccount } = useAccountStore();
  const { transactions, isLoading: transactionsLoading, loadTransactions, addTransaction, deleteTransaction } = useTransactionStore();
  const { groups } = useBudgetStore();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  // const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionForm, setTransactionForm] = useState<CreateTransactionDto>({
    account_id: 0,
    amount: 0,
    date: new Date(),
    payee: '',
    is_shared: false,
    notes: ''
  });

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions({ account_id: selectedAccount.id });
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
      account_id: targetAccount.id,
      amount: 0,
      date: new Date(),
      payee: '',
      is_shared: false,
      notes: ''
    });
    // setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addTransaction(transactionForm);
      setShowTransactionForm(false);
      // Reload accounts to update balances
      loadAccounts();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
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

  const formatTransactionDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Get all categories from all groups for the select
  const allCategories = groups.flatMap(group => group.categories);

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando contas...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Contas</h1>
        <button
          onClick={() => openTransactionForm()}
          disabled={!selectedAccount}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nova Transação</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Contas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Suas Contas</h2>
          
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedAccount?.id === account.id 
                  ? 'border-2 border-blue-500 bg-gray-700' 
                  : 'hover:bg-gray-700'
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
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">Nenhuma conta cadastrada</p>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
                Adicionar Conta
              </button>
            </div>
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
                  <h3 className="text-lg font-semibold text-white">Transações Recentes</h3>
                </div>
                
                <div className="divide-y divide-gray-700">
                  {transactionsLoading ? (
                    <div className="p-6 text-center text-gray-400">
                      Carregando transações...
                    </div>
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 hover:bg-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2 text-white font-medium">
                                <span>{transaction.payee}</span>
                                {transaction.is_shared && (
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
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      Nenhuma transação encontrada
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <BuildingLibraryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Selecione uma Conta
              </h3>
              <p className="text-gray-400">
                Escolha uma conta na lista ao lado para ver suas transações
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulário de Transação */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
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
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    date: new Date(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Ex: Supermercado, Restaurante..."
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
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({
                    ...transactionForm,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={transactionForm.is_shared}
                    onChange={(e) => setTransactionForm({
                      ...transactionForm,
                      is_shared: e.target.checked
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
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