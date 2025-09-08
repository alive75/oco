import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { BudgetCategory } from '../budgets/entities/budget-category.entity';

export interface MonthlySummary {
  month: string;
  totalSpent: number;
  totalSharedSpent: number;
  totalPersonalSpent: number;
  categoryBreakdown: Array<{
    categoryName: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }>;
  topExpenses: Array<{
    payee: string;
    amount: number;
    date: Date;
    category?: string;
  }>;
}

export interface AccountsBalance {
  totalBalance: number;
  accounts: Array<{
    id: number;
    name: string;
    type: string;
    balance: number;
    currency: string;
  }>;
  byType: {
    checking: number;
    creditCard: number;
    investment: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(BudgetCategory)
    private budgetCategoriesRepository: Repository<BudgetCategory>,
  ) {}

  async getMonthlySummary(month: Date, userId: number): Promise<MonthlySummary> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Buscar todas as transações do usuário no mês
    const transactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('account.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      })
      .orderBy('transaction.amount', 'DESC')
      .getMany();

    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalSharedSpent = transactions
      .filter(t => t.isShared)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalPersonalSpent = totalSpent - totalSharedSpent;

    // Agrupar por categoria
    const categoryMap = new Map<string, { spent: number; allocated: number; categoryId?: number }>();
    
    transactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Sem categoria';
      const amount = Number(transaction.amount);
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { 
          spent: 0, 
          allocated: transaction.category ? Number(transaction.category.allocatedAmount) : 0,
          categoryId: transaction.category?.id
        });
      }
      
      categoryMap.get(categoryName)!.spent += amount;
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
      categoryName,
      allocated: data.allocated,
      spent: data.spent,
      remaining: data.allocated - data.spent,
      percentageUsed: data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0
    })).sort((a, b) => b.spent - a.spent);

    // Top 10 maiores gastos
    const topExpenses = transactions
      .slice(0, 10)
      .map(t => ({
        payee: t.payee,
        amount: Number(t.amount),
        date: t.date,
        category: t.category?.name
      }));

    return {
      month: month.toISOString().split('T')[0],
      totalSpent,
      totalSharedSpent,
      totalPersonalSpent,
      categoryBreakdown,
      topExpenses
    };
  }

  async getAccountsBalance(userId: number): Promise<AccountsBalance> {
    const accounts = await this.accountsRepository.find({
      where: { user: { id: userId } }
    });

    const accountsData = accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      currency: 'BRL'
    }));

    const totalBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);

    const byType = {
      checking: accountsData
        .filter(acc => acc.type === 'CHECKING')
        .reduce((sum, acc) => sum + acc.balance, 0),
      creditCard: accountsData
        .filter(acc => acc.type === 'CREDIT_CARD')
        .reduce((sum, acc) => sum + acc.balance, 0),
      investment: accountsData
        .filter(acc => acc.type === 'INVESTMENT')
        .reduce((sum, acc) => sum + acc.balance, 0)
    };

    return {
      totalBalance,
      accounts: accountsData,
      byType
    };
  }

  async getCashFlow(startDate: Date, endDate: Date, userId: number): Promise<{
    period: string;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    dailyBreakdown: Array<{
      date: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  }> {
    const transactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('account.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .orderBy('transaction.date', 'ASC')
      .getMany();

    // Assumindo que receitas têm categorias específicas ou contas específicas
    // Por simplicidade, vamos considerar valores positivos em conta corrente como receita
    // e valores negativos ou gastos em cartão como despesas
    
    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = 5000; // Valor fixo para desenvolvimento - seria calculado baseado em receitas reais
    const netFlow = totalIncome - totalExpenses;

    // Agrupar por dia
    const dailyMap = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(transaction => {
      const dateKey = transaction.date.toISOString().split('T')[0];
      const amount = Number(transaction.amount);
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { income: 0, expenses: 0 });
      }
      
      // Simplificação: todas as transações são consideradas despesas
      dailyMap.get(dateKey)!.expenses += amount;
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      totalIncome,
      totalExpenses,
      netFlow,
      dailyBreakdown
    };
  }

  async getDashboardSummary(userId: number): Promise<{
    readyToAssign: number;
    totalBalance: number;
    sharedExpenses: number;
  }> {
    const currentMonth = new Date();
    
    // Buscar valor "Pronto para Atribuir"
    const { BudgetsService } = await import('../budgets/budgets.service');
    const { BudgetGroup } = await import('../budgets/entities/budget-group.entity');
    const { BudgetCategory } = await import('../budgets/entities/budget-category.entity');
    
    const budgetGroupRepository = this.transactionsRepository.manager.getRepository(BudgetGroup);
    const budgetCategoryRepository = this.transactionsRepository.manager.getRepository(BudgetCategory);
    const budgetsService = new BudgetsService(budgetGroupRepository, budgetCategoryRepository);
    
    const readyToAssign = await budgetsService.getReadyToAssign(currentMonth);

    // Buscar saldo total das contas
    const accountsBalance = await this.getAccountsBalance(userId);
    const totalBalance = accountsBalance.totalBalance;

    // Calcular gastos compartilhados do mês atual
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const sharedTransactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('account.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('transaction.isShared = :isShared', { isShared: true })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      })
      .getMany();

    const sharedExpenses = sharedTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return {
      readyToAssign,
      totalBalance,
      sharedExpenses
    };
  }

  async getRecentTransactions(userId: number, limit: number = 5): Promise<Array<{
    id: number;
    date: Date;
    payee: string;
    amount: number;
    accountName: string;
    categoryName?: string;
  }>> {
    const transactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('account.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return transactions.map(t => ({
      id: t.id,
      date: t.date,
      payee: t.payee,
      amount: Number(t.amount),
      accountName: t.account?.name || 'Conta desconhecida',
      categoryName: t.category?.name
    }));
  }
}