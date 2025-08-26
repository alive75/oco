import { useEffect } from 'react';
import { useSharedStore } from '../../stores/shared.store';
import { formatCurrency } from '../../utils/currency';
import { SharedSkeleton } from '../../components/Skeleton';
import { NoSharedExpenses } from '../../components/EmptyStates';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  Tag as TagIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  PieChart as PieChartIcon
} from 'lucide-react';

export default function Shared() {
  const {
    currentMonth,
    balance,
    sharedTransactions,
    isLoading,
    setCurrentMonth,
    loadMonthlyData,
    settle
  } = useSharedStore();

  useEffect(() => {
    loadMonthlyData(currentMonth);
  }, [loadMonthlyData, currentMonth]);

  const formatMonthYear = (date: Date) => {
    const validDate = new Date(date);
    return validDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatTransactionDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleSettle = async () => {
    if (!window.confirm('Tem certeza que deseja marcar como quitado? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await settle(currentMonth);
    } catch (error) {
      console.error('Erro ao quitar despesas:', error);
    }
  };

  const getDebtorInfo = () => {
    if (!balance || balance.isBalanced) return null;
    
    const user1Name = 'Usuário 1'; // Você pode buscar dos dados do usuário
    const user2Name = 'Usuário 2';
    
    if (balance.owedBy === 1) {
      return {
        debtor: user1Name,
        creditor: user2Name,
        amount: balance.amount
      };
    } else {
      return {
        debtor: user2Name,
        creditor: user1Name,
        amount: balance.amount
      };
    }
  };

  const debtInfo = getDebtorInfo();

  if (isLoading) {
    return <SharedSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com navegação do mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <h1 className="text-2xl font-bold text-white capitalize">
          Despesas Compartilhadas - {formatMonthYear(currentMonth)}
        </h1>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo do Balanço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Usuário 1 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">
                Total pago por Usuário 1
              </h3>
              <div className="text-2xl font-bold text-blue-400 mt-2">
                {formatCurrency(balance?.user1Paid || 0)}
              </div>
            </div>
            <UserIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        {/* Total Usuário 2 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">
                Total pago por Usuário 2
              </h3>
              <div className="text-2xl font-bold text-green-400 mt-2">
                {formatCurrency(balance?.user2Paid || 0)}
              </div>
            </div>
            <UserIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        {/* Balanço */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Situação</h3>
              {balance?.isBalanced ? (
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  <span className="text-lg font-semibold text-green-400">
                    Quitado
                  </span>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircleIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-yellow-400">Pendente</span>
                  </div>
                  {debtInfo && (
                    <div className="text-sm text-gray-300">
                      <span className="text-red-400">{debtInfo.debtor}</span> deve{' '}
                      <span className="font-semibold text-white">
                        {formatCurrency(debtInfo.amount)}
                      </span>{' '}
                      para{' '}
                      <span className="text-green-400">{debtInfo.creditor}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              {!balance?.isBalanced && balance?.amount && (
                <button
                  onClick={handleSettle}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Marcar como Quitado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Proporção (conceitual) */}
      {balance && (balance.user1Paid > 0 || balance.user2Paid > 0) && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2" />
            Proporção de Gastos
          </h3>
          
          <div className="flex items-center space-x-4">
            {/* Barra visual */}
            <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-blue-400 h-full"
                  style={{
                    width: `${(balance.user1Paid / (balance.user1Paid + balance.user2Paid)) * 100}%`
                  }}
                ></div>
                <div 
                  className="bg-green-400 h-full"
                  style={{
                    width: `${(balance.user2Paid / (balance.user1Paid + balance.user2Paid)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            
            {/* Legenda */}
            <div className="flex space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span className="text-gray-300">Usuário 1</span>
                <span className="text-white font-semibold">
                  {((balance.user1Paid / (balance.user1Paid + balance.user2Paid)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span className="text-gray-300">Usuário 2</span>
                <span className="text-white font-semibold">
                  {((balance.user2Paid / (balance.user1Paid + balance.user2Paid)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Transações Compartilhadas */}
      <div className="bg-gray-800 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Transações Compartilhadas
            </h3>
            <div className="text-sm text-gray-400">
              {sharedTransactions.length} transação(ões)
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {sharedTransactions.length > 0 ? (
            sharedTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-700 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 text-white font-medium">
                        <span>{transaction.payee}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          transaction.paidByUserId === 1 
                            ? 'bg-blue-600 text-blue-100' 
                            : 'bg-green-600 text-green-100'
                        }`}>
                          Pago por {transaction.user.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
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
                      </div>
                      
                      {transaction.notes && (
                        <div className="text-sm text-gray-400 mt-1">
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white mb-1">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(transaction.individualAmount)} por pessoa
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <NoSharedExpenses />
          )}
        </div>
      </div>

      {/* Resumo no rodapé */}
      {sharedTransactions.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-400">Total compartilhado: </span>
                <span className="text-white font-semibold">
                  {formatCurrency((balance?.user1Paid || 0) + (balance?.user2Paid || 0))}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Valor por pessoa: </span>
                <span className="text-white font-semibold">
                  {formatCurrency(((balance?.user1Paid || 0) + (balance?.user2Paid || 0)) / 2)}
                </span>
              </div>
            </div>
            
            {!balance?.isBalanced && (
              <div className="text-xs text-gray-400">
                💡 Dica: Clique em "Marcar como Quitado" quando a dívida for paga
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}