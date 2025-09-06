import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';

interface DashboardSummary {
  readyToAssign: number;
  totalBalance: number;
  sharedExpenses: number;
}

interface RecentTransaction {
  id: number;
  date: string;
  payee: string;
  amount: number;
  accountName: string;
  categoryName?: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({
    readyToAssign: 0,
    totalBalance: 0,
    sharedExpenses: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [summaryData, transactionsData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentTransactions()
        ]);
        
        setSummary(summaryData);
        setRecentTransactions(transactionsData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Manter valores padrão em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 p-6 rounded-lg">
                <div className="h-5 bg-gray-700 rounded mb-3"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/budget" className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-colors">
          <h3 className="text-lg font-semibold text-white mb-2">Pronto para Atribuir</h3>
          <div className={`text-2xl font-bold ${summary.readyToAssign >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(summary.readyToAssign)}
          </div>
          <div className="text-sm text-gray-400">Clique para gerenciar orçamento</div>
        </Link>

        <Link to="/accounts" className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-colors">
          <h3 className="text-lg font-semibold text-white mb-2">Saldo Total</h3>
          <div className={`text-2xl font-bold ${summary.totalBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatCurrency(summary.totalBalance)}
          </div>
          <div className="text-sm text-gray-400">Todas as contas</div>
        </Link>

        <Link to="/shared" className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-colors">
          <h3 className="text-lg font-semibold text-white mb-2">Gastos Compartilhados</h3>
          <div className="text-2xl font-bold text-yellow-400">
            {formatCurrency(summary.sharedExpenses)}
          </div>
          <div className="text-sm text-gray-400">Este mês</div>
        </Link>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Transações Recentes</h2>
          <Link to="/accounts" className="text-blue-400 hover:text-blue-300 text-sm">
            Ver todas
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{transaction.payee}</span>
                    <span className={`font-semibold ${transaction.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{transaction.accountName}</span>
                    {transaction.categoryName && (
                      <>
                        <span>•</span>
                        <span>{transaction.categoryName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}