import { useState, useEffect } from 'react';
import { useAccountStore } from '../../stores/account.store';
import { useTransactionStore } from '../../stores/transaction.store';
import { useBudgetStore } from '../../stores/budget.store';
import { transactionService } from '../../services/transaction.service';
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
  Edit as EditIcon,
  Trash as TrashIcon,
  Search as SearchIcon
} from 'lucide-react';
import type { Account, Transaction, CreateTransactionDto, CreateAccountDto } from '../../types';

export default function Accounts() {
  // const { user } = useAuthStore();
  const { accounts, selectedAccount, isLoading: accountsLoading, loadAccounts, selectAccount, createAccount, deleteAccount } = useAccountStore();
  const { transactions, isLoading: transactionsLoading, loadTransactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();
  const { groups, loadBudget } = useBudgetStore();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountForm, setAccountForm] = useState<CreateAccountDto>({
    name: '',
    type: 'CHECKING',
    balance: 0
  });

  useEffect(() => {
    loadAccounts();
    loadBudget();
  }, [loadAccounts, loadBudget]);

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

  const openTransactionForm = (account?: Account, transaction?: Transaction) => {
    const targetAccount = account || selectedAccount;
    if (!targetAccount) return;
    
    if (transaction) {
    } else {
    }
    setShowTransactionForm(true);
  };


  const handleTransactionSave = async (transactionData: CreateTransactionDto & { id?: number }) => {
    console.log('Dados da transação sendo salvos:', transactionData);
    
    try {
      if (transactionData.id) {
        // Update existing transaction
        console.log('Atualizando transação existente:', transactionData.id);
        await updateTransaction(transactionData.id, transactionData);
      } else {
        // Create new transaction
        console.log('Criando nova transação:', transactionData);
        await addTransaction(transactionData);
      }
      
      // Reload accounts to update balances
      loadAccounts();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      const errorResponse = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Detalhes do erro:', errorResponse.response?.data);
      alert(`Erro ao salvar transação: ${errorResponse.response?.data?.message || errorResponse.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!transactionId || isNaN(transactionId) || transactionId <= 0) {
      console.error('ID da transação inválido:', transactionId);
      alert('Erro: ID da transação inválido.');
      return;
    }
    
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

  const handleTransactionUpdate = async (transactionId: number, data: CreateTransactionDto & { id?: number }) => {
    if (!transactionId || isNaN(transactionId) || transactionId <= 0) {
      console.error('ID da transação inválido:', transactionId);
      alert('Erro: ID da transação inválido.');
      return;
    }
    
    try {
      await updateTransaction(transactionId, data);
      // Reload accounts to update balances
      loadAccounts();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      alert('Erro ao atualizar transação. Tente novamente.');
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

  const handleDeleteAccount = async (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    if (!window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      return;
    }
    
    try {
      await deleteAccount(accountId);
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { message?: string } }; message?: string };
      console.error('Erro ao deletar conta:', error);
      let errorMessage = 'Erro ao deletar conta. Tente novamente.';
      
      if (errorResponse.response?.data?.message) {
        errorMessage = errorResponse.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const formatTransactionDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Get all categories from all groups for the select
  const allCategories = groups.flatMap(group => group.categories || []);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Componente para linha de transação (inline editing)
  interface TransactionRowProps {
    isNew: boolean;
    transaction: Transaction | Record<string, never>;
    allCategories: { id: number; name: string }[];
    onSave: (data: CreateTransactionDto & { id?: number }) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => Promise<void>;
  }
  
  const TransactionRow = ({ isNew, transaction, allCategories, onSave, onCancel, onDelete }: TransactionRowProps) => {
    const [isEditing, setIsEditing] = useState(isNew);
    const txn = transaction as Transaction;
    const [formData, setFormData] = useState({
      date: isNew ? new Date().toISOString().slice(0, 10) : new Date(txn.date).toISOString().slice(0, 10),
      payee: isNew ? '' : txn.payee || '',
      categoryId: isNew ? '' : (txn.categoryId?.toString() || ''),
      notes: isNew ? '' : (txn.notes || ''),
      isShared: isNew ? false : txn.isShared || false,
      paidAmount: isNew ? '' : (txn.amount && txn.amount > 0 ? txn.amount.toString() : ''),
      receivedAmount: isNew ? '' : (txn.amount && txn.amount < 0 ? Math.abs(txn.amount).toString() : '')
    });
    
    const [payeeSuggestions, setPayeeSuggestions] = useState<string[]>([]);
    const [showPayeeSuggestions, setShowPayeeSuggestions] = useState(false);
    const [payeeSearchTimeout, setPayeeSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const searchPayees = async (query: string) => {
      if (!query || query.length < 2) {
        setPayeeSuggestions([]);
        setShowPayeeSuggestions(false);
        return;
      }
      
      try {
        const suggestions = await transactionService.searchPayees(query);
        setPayeeSuggestions(suggestions);
        setShowPayeeSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Erro ao buscar pagantes:', error);
        setPayeeSuggestions([]);
        setShowPayeeSuggestions(false);
      }
    };

    const handlePayeeChange = (value: string) => {
      setFormData({ ...formData, payee: value });
      
      // Debounce the search
      if (payeeSearchTimeout) {
        clearTimeout(payeeSearchTimeout);
      }
      
      const timeout = setTimeout(() => {
        searchPayees(value);
      }, 300);
      
      setPayeeSearchTimeout(timeout);
    };

    const selectPayee = (payee: string) => {
      setFormData({ ...formData, payee });
      setShowPayeeSuggestions(false);
      setPayeeSuggestions([]);
    };

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validações
      if (!formData.payee.trim()) {
        alert('Pagante é obrigatório');
        return;
      }
      
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      const receivedAmount = parseFloat(formData.receivedAmount) || 0;
      
      if (paidAmount === 0 && receivedAmount === 0) {
        alert('Deve ser informado um valor pago ou recebido');
        return;
      }
      
      if (paidAmount > 0 && receivedAmount > 0) {
        alert('Não é possível ter valor pago e recebido na mesma transação');
        return;
      }
      
      // Determinar o amount baseado em pago ou recebido
      // Valores positivos = gastos (diminuem saldo)
      // Valores negativos = receitas (aumentam saldo)
      const amount = receivedAmount > 0 ? -receivedAmount : paidAmount;
      
      if (!selectedAccount) {
        alert('Nenhuma conta selecionada');
        return;
      }
      
      const data = {
        accountId: selectedAccount.id,
        date: new Date(formData.date), // Convert string to Date
        payee: formData.payee.trim(),
        amount: amount,
        categoryId: formData.categoryId && parseInt(formData.categoryId) > 0 ? parseInt(formData.categoryId) : undefined,
        notes: formData.notes.trim() || undefined,
        isShared: formData.isShared
      };
      
      onSave(isNew ? data : data);
      
      if (isNew) {
        // Reset form for new transaction
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          payee: '',
          categoryId: '',
          notes: '',
          isShared: false,
          paidAmount: '',
          receivedAmount: ''
        });
      } else {
        setIsEditing(false);
      }
    };

    const handleCancel = () => {
      if (isNew) {
        onCancel();
      } else {
        setIsEditing(false);
        // Reset form data
        setFormData({
          date: new Date(txn.date).toISOString().slice(0, 10),
          payee: txn.payee || '',
          categoryId: txn.categoryId?.toString() || '',
          notes: txn.notes || '',
          isShared: txn.isShared || false,
          paidAmount: txn.amount && txn.amount < 0 ? Math.abs(txn.amount).toString() : '',
          receivedAmount: txn.amount && txn.amount >= 0 ? txn.amount.toString() : ''
        });
      }
    };

    if (isEditing) {
      return (
        <tr className="bg-gray-750 border-2 border-blue-500">
          <td className="px-4 py-3">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </td>
          <td className="px-4 py-3 relative">
            <input
              type="text"
              value={formData.payee}
              onChange={(e) => handlePayeeChange(e.target.value)}
              onFocus={() => formData.payee.length >= 2 && searchPayees(formData.payee)}
              onBlur={() => {
                // Delay hiding suggestions to allow click
                setTimeout(() => setShowPayeeSuggestions(false), 200);
              }}
              placeholder="Nome do pagante..."
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            {showPayeeSuggestions && payeeSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-gray-700 border border-gray-500 rounded-b max-h-32 overflow-y-auto">
                {payeeSuggestions.map((payee, index) => (
                  <div
                    key={index}
                    onClick={() => selectPayee(payee)}
                    className="px-2 py-1 hover:bg-gray-600 cursor-pointer text-white text-sm"
                  >
                    {payee}
                  </div>
                ))}
              </div>
            )}
          </td>
          <td className="px-4 py-3">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </td>
          <td className="px-4 py-3">
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações..."
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <input
              type="checkbox"
              checked={formData.isShared}
              onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
              className="rounded bg-gray-600 border-gray-500"
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.paidAmount}
              onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value, receivedAmount: '' })}
              placeholder="0,00"
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.receivedAmount}
              onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value, paidAmount: '' })}
              placeholder="0,00"
              className="w-full px-2 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
            />
          </td>
          <td className="px-4 py-3 text-center">
            <div className="flex items-center justify-center space-x-1">
              <button
                onClick={handleSave}
                className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-all duration-200"
                title="Salvar"
              >
                <span className="text-sm">✓</span>
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-all duration-200"
                title="Cancelar"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          </td>
        </tr>
      );
    }

    // Display mode
    return (
      <tr className="hover:bg-gray-750 transition-colors duration-200">
        <td className="px-4 py-4 text-sm text-gray-300">
          {txn.date ? formatTransactionDate(txn.date) : '-'}
        </td>
        <td className="px-4 py-4 text-sm text-white font-medium">
          {txn.payee || '-'}
        </td>
        <td className="px-4 py-4 text-sm text-gray-300">
          {txn.category?.name || '-'}
        </td>
        <td className="px-4 py-4 text-sm text-gray-300">
          {txn.notes || '-'}
        </td>
        <td className="px-4 py-4 text-center">
          {txn.isShared && (
            <span className="px-2 py-1 bg-blue-600 text-xs rounded text-white">
              ✓
            </span>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-right text-red-400 font-medium">
          {txn.amount && txn.amount > 0 ? formatCurrency(txn.amount) : '-'}
        </td>
        <td className="px-4 py-4 text-sm text-right text-green-400 font-medium">
          {txn.amount && txn.amount < 0 ? formatCurrency(Math.abs(txn.amount)) : '-'}
        </td>
        <td className="px-4 py-4 text-center">
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all duration-200"
              title="Editar"
            >
              <EditIcon className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-all duration-200"
              title="Excluir"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

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
    <div className="max-w-7xl mx-auto p-6">
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

      {/* Lista de Contas - Horizontal */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-300">Suas Contas</h2>
          <div className="text-sm text-gray-400">
            {accounts.length > 0 ? `${accounts.length} conta${accounts.length > 1 ? 's' : ''}` : 'Nenhuma conta'}
          </div>
        </div>
        
        {accounts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`bg-gray-800 rounded-lg p-4 transition-all duration-200 flex-shrink-0 w-80 ${
                  selectedAccount?.id === account.id 
                    ? 'border-2 border-blue-500 bg-gray-700 ring-2 ring-blue-500 ring-opacity-20' 
                    : 'hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div 
                  className="cursor-pointer" 
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-gray-400">
                        {getAccountIcon(account.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-medium truncate">{account.name}</h3>
                        <p className="text-sm text-gray-400">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0 min-w-0">
                      <div className={`text-sm font-semibold whitespace-nowrap ${
                        account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(account.balance)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(account.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-all duration-200"
                    title={`Excluir conta "${account.name}"`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NoAccounts onAddAccount={() => setShowAccountForm(true)} />
        )}
      </div>

      {/* Detalhes da Conta e Transações */}
      <div>
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

              {/* Lista de Transações - Estilo Planilha */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Transações</h3>
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
                
                <div className="overflow-hidden">
                  <table className="w-full table-auto">
                    {/* Cabeçalho */}
                    <thead className="bg-gray-700 border-b border-gray-600">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-28">
                          Data
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Pagante
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-36">
                          Categoria
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Anotação
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-20">
                          Compart.?
                        </th>
                        <th className="px-4 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-28">
                          Pago
                        </th>
                        <th className="px-4 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-28">
                          Recebido
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-20">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {transactionsLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8">
                            <LoadingTransactions />
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* Nova Linha de Transação */}
                          {showTransactionForm && (
                            <TransactionRow
                              isNew={true}
                              transaction={{} as Record<string, never>}
                              allCategories={allCategories}
                              onSave={handleTransactionSave}
                              onCancel={() => setShowTransactionForm(false)}
                              onDelete={() => Promise.resolve()}
                            />
                          )}
                          
                          {/* Transações Existentes */}
                          {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((transaction) => (
                              <TransactionRow
                                key={transaction.id}
                                isNew={false}
                                transaction={transaction}
                                allCategories={allCategories}
                                onSave={(data) => handleTransactionUpdate(transaction.id, data)}
                                onCancel={() => {}}
                                onDelete={() => handleDeleteTransaction(transaction.id)}
                              />
                            ))
                          ) : !showTransactionForm && transactions.length > 0 && debouncedSearchQuery ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
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
                              </td>
                            </tr>
                          ) : !showTransactionForm ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8">
                                <NoTransactions onAddTransaction={() => openTransactionForm(selectedAccount)} />
                              </td>
                            </tr>
                          ) : null}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <NoAccountsSelected />
          )}
      </div>

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