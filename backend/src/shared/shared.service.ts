import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from '../users/entities/user.entity';

export interface SharedBalance {
  user1Paid: number;
  user2Paid: number;
  user1Name: string;
  user2Name: string;
  owedBy: number | null;
  owedByName: string | null;
  amount: number;
  totalShared: number;
}

@Injectable()
export class SharedService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getMonthlyBalance(month: Date): Promise<SharedBalance> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    // Buscar todas as transações compartilhadas do mês
    const sharedTransactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.paidBy', 'paidBy')
      .where('transaction.isShared = true')
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      })
      .getMany();

    // Buscar todos os usuários para obter os nomes
    const users = await this.usersRepository.find();
    const user1 = users.find(u => u.id === 1);
    const user2 = users.find(u => u.id === 2);

    if (!user1 || !user2) {
      throw new Error('Usuários não encontrados');
    }

    // Calcular totais pagos por cada usuário
    let user1Paid = 0;
    let user2Paid = 0;

    for (const transaction of sharedTransactions) {
      const amount = Number(transaction.amount);
      if (transaction.paidBy.id === 1) {
        user1Paid += amount;
      } else if (transaction.paidBy.id === 2) {
        user2Paid += amount;
      }
    }

    const totalShared = user1Paid + user2Paid;
    const halfTotal = totalShared / 2;

    // Calcular quem deve para quem
    let owedBy: number | null = null;
    let owedByName: string | null = null;
    let amount = 0;

    if (user1Paid > halfTotal) {
      // Usuário 2 deve para usuário 1
      owedBy = 2;
      owedByName = user2.name;
      amount = user1Paid - halfTotal;
    } else if (user2Paid > halfTotal) {
      // Usuário 1 deve para usuário 2
      owedBy = 1;
      owedByName = user1.name;
      amount = user2Paid - halfTotal;
    }

    return {
      user1Paid,
      user2Paid,
      user1Name: user1.name,
      user2Name: user2.name,
      owedBy,
      owedByName,
      amount: Math.abs(amount),
      totalShared,
    };
  }

  async getSharedTransactions(month: Date): Promise<Transaction[]> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paidBy', 'paidBy')
      .where('transaction.isShared = true')
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      })
      .orderBy('transaction.date', 'DESC')
      .getMany();
  }

  async calculateOwedAmount(month: Date): Promise<{ owedBy: number | null; amount: number }> {
    const balance = await this.getMonthlyBalance(month);
    return {
      owedBy: balance.owedBy,
      amount: balance.amount,
    };
  }

  async markAsSettled(month: Date, settlingUserId: number): Promise<{ message: string; transferTransaction?: any }> {
    const balance = await this.getMonthlyBalance(month);
    
    if (!balance.owedBy || balance.amount === 0) {
      return { message: 'Não há valores pendentes para quitar' };
    }

    // Identificar quem deve e quem recebe
    const debtorId = balance.owedBy;
    const creditorId = debtorId === 1 ? 2 : 1;

    // Buscar contas correntes dos usuários
    const debtorAccount = await this.findUserCheckingAccount(debtorId);
    const creditorAccount = await this.findUserCheckingAccount(creditorId);

    if (!debtorAccount || !creditorAccount) {
      throw new Error('Contas correntes não encontradas para os usuários');
    }

    // Criar transação de transferência
    const transferDescription = `Acerto despesas compartilhadas - ${month.toISOString().split('T')[0]}`;
    
    const transferTransaction = this.transactionsRepository.create({
      date: new Date(),
      payee: transferDescription,
      amount: balance.amount,
      isShared: false,
      notes: `Transferência automática para acerto de contas. Devedor: ${balance.owedByName}`,
      account: debtorAccount,
      category: null, // Transferência não tem categoria
      paidBy: { id: debtorId }
    });

    await this.transactionsRepository.save(transferTransaction);

    // Atualizar saldos das contas
    await this.updateAccountBalance(debtorAccount, -balance.amount); // Diminui saldo do devedor
    await this.updateAccountBalance(creditorAccount, balance.amount); // Aumenta saldo do credor

    return {
      message: `Transferência de R$ ${balance.amount.toFixed(2)} realizada de ${balance.owedByName} para ${creditorId === 1 ? balance.user1Name : balance.user2Name}`,
      transferTransaction: {
        id: transferTransaction.id,
        amount: balance.amount,
        from: balance.owedByName,
        to: creditorId === 1 ? balance.user1Name : balance.user2Name,
        date: transferTransaction.date
      }
    };
  }

  private async findUserCheckingAccount(userId: number) {
    const { Account, AccountType } = await import('../accounts/entities/account.entity');
    const accountRepository = this.transactionsRepository.manager.getRepository(Account);
    
    return accountRepository.findOne({
      where: { 
        user: { id: userId },
        type: AccountType.CHECKING
      }
    });
  }

  private async updateAccountBalance(account: any, amount: number): Promise<void> {
    const { Account } = await import('../accounts/entities/account.entity');
    const accountRepository = this.transactionsRepository.manager.getRepository(Account);
    
    const currentBalance = Number(account.balance);
    const newBalance = currentBalance + amount;
    
    await accountRepository.update(account.id, { balance: newBalance });
  }

  async getDetailedSharedReport(month: Date): Promise<{
    summary: SharedBalance;
    transactionsByUser: {
      user1Transactions: Transaction[];
      user2Transactions: Transaction[];
    };
    categoryBreakdown: Array<{
      categoryName: string;
      user1Amount: number;
      user2Amount: number;
      totalAmount: number;
    }>;
  }> {
    const summary = await this.getMonthlyBalance(month);
    const sharedTransactions = await this.getSharedTransactions(month);

    // Separar transações por usuário
    const user1Transactions = sharedTransactions.filter(t => t.paidBy.id === 1);
    const user2Transactions = sharedTransactions.filter(t => t.paidBy.id === 2);

    // Agrupar por categoria
    const categoryMap = new Map<string, { user1Amount: number; user2Amount: number }>();
    
    sharedTransactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Sem categoria';
      const amount = Number(transaction.amount);
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { user1Amount: 0, user2Amount: 0 });
      }
      
      const categoryData = categoryMap.get(categoryName)!;
      if (transaction.paidBy.id === 1) {
        categoryData.user1Amount += amount;
      } else {
        categoryData.user2Amount += amount;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryName, amounts]) => ({
      categoryName,
      user1Amount: amounts.user1Amount,
      user2Amount: amounts.user2Amount,
      totalAmount: amounts.user1Amount + amounts.user2Amount
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      summary,
      transactionsByUser: {
        user1Transactions,
        user2Transactions
      },
      categoryBreakdown
    };
  }
}