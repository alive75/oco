import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { Account, AccountType } from '../accounts/entities/account.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async findAll(filters?: TransactionFiltersDto): Promise<Transaction[]> {
    const query = this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paidBy', 'paidBy');

    if (filters?.accountId) {
      const accountId = parseInt(filters.accountId, 10);
      if (!isNaN(accountId)) {
        query.andWhere('account.id = :accountId', { accountId });
      }
    }

    if (filters?.categoryId) {
      const categoryId = parseInt(filters.categoryId, 10);
      if (!isNaN(categoryId)) {
        query.andWhere('category.id = :categoryId', { categoryId });
      }
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters?.isShared !== undefined) {
      query.andWhere('transaction.isShared = :isShared', { isShared: filters.isShared });
    }

    if (filters?.userId) {
      const userId = parseInt(filters.userId, 10);
      if (!isNaN(userId)) {
        query.andWhere('paidBy.id = :userId', { userId });
      }
    }

    return query.orderBy('transaction.date', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['account', 'category', 'paidBy'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto, userId: number): Promise<Transaction> {
    // Verificar se a conta existe e pertence ao usuário
    const account = await this.accountsRepository.findOne({
      where: { id: createTransactionDto.accountId, user: { id: userId } },
      relations: ['user']
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    // TODO: Verificar se categoria existe e pertence ao mês corrente
    // Isso será implementado quando tivermos a validação de categoria

    const transaction = this.transactionsRepository.create({
      date: new Date(createTransactionDto.date),
      payee: createTransactionDto.payee,
      amount: createTransactionDto.amount,
      isShared: createTransactionDto.isShared || false,
      notes: createTransactionDto.notes,
      account: { id: createTransactionDto.accountId },
      category: createTransactionDto.categoryId ? { id: createTransactionDto.categoryId } : null,
      paidBy: { id: userId },
    });

    const savedTransaction = await this.transactionsRepository.save(transaction);

    // Atualizar saldo da conta
    await this.updateAccountBalance(account, createTransactionDto.amount);

    // Lógica especial para cartão de crédito
    if (account.type === AccountType.CREDIT_CARD && createTransactionDto.categoryId) {
      await this.handleCreditCardTransaction(account, createTransactionDto.categoryId, createTransactionDto.amount);
    }

    return this.findOne(savedTransaction.id);
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto, userId: number): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // Verificar se o usuário pode editar esta transação (por conta)
    const account = await this.accountsRepository.findOne({
      where: { id: transaction.account.id, user: { id: userId } },
    });

    if (!account) {
      throw new BadRequestException('Você não pode editar esta transação');
    }

    // Reverter alteração no saldo da conta (valor antigo)
    await this.updateAccountBalance(account, -Number(transaction.amount));

    // Atualizar transação
    Object.assign(transaction, updateTransactionDto);
    if (updateTransactionDto.date) {
      transaction.date = new Date(updateTransactionDto.date);
    }

    const updatedTransaction = await this.transactionsRepository.save(transaction);

    // Aplicar novo valor ao saldo da conta
    const newAmount = updateTransactionDto.amount !== undefined 
      ? updateTransactionDto.amount 
      : Number(transaction.amount);
    await this.updateAccountBalance(account, newAmount);

    return this.findOne(updatedTransaction.id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const transaction = await this.findOne(id);

    // Verificar se o usuário pode deletar esta transação
    const account = await this.accountsRepository.findOne({
      where: { id: transaction.account.id, user: { id: userId } },
    });

    if (!account) {
      throw new BadRequestException('Você não pode deletar esta transação');
    }

    // Reverter valor no saldo da conta
    await this.updateAccountBalance(account, -Number(transaction.amount));

    await this.transactionsRepository.remove(transaction);
  }

  private async updateAccountBalance(account: Account, amount: number): Promise<void> {
    const currentBalance = Number(account.balance);
    let newBalance: number;

    if (account.type === AccountType.CREDIT_CARD) {
      // Para cartão de crédito, gastos aumentam o saldo (dívida)
      // Pagamentos diminuem o saldo
      newBalance = currentBalance + amount;
    } else {
      // Para outras contas, gastos diminuem o saldo
      newBalance = currentBalance - amount;
    }

    await this.accountsRepository.update(account.id, { balance: newBalance });
  }

  async getCategorySpent(categoryId: number, month?: Date): Promise<number> {
    const query = this.transactionsRepository.createQueryBuilder('transaction')
      .where('transaction.categoryId = :categoryId', { categoryId });

    if (month) {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      query.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      });
    }

    const transactions = await query.getMany();
    return transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  async searchPayees(query: string, userId: number): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const result = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.payee', 'payee')
      .innerJoin('transaction.paidBy', 'paidBy')
      .where('paidBy.id = :userId', { userId })
      .andWhere('LOWER(transaction.payee) LIKE LOWER(:query)', { query: `%${query.trim()}%` })
      .orderBy('transaction.payee', 'ASC')
      .limit(10)
      .getRawMany();

    return result.map(item => item.payee);
  }

  async getSharedTransactions(month?: Date): Promise<Transaction[]> {
    const query = this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paidBy', 'paidBy')
      .where('transaction.isShared = true');

    if (month) {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      query.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      });
    }

    return query.orderBy('transaction.date', 'DESC').getMany();
  }

  private async handleCreditCardTransaction(account: Account, categoryId: number, amount: number): Promise<void> {
    try {
      // Importar entities dinamicamente
      const { BudgetCategory } = await import('../budgets/entities/budget-category.entity');
      
      const budgetCategoryRepository = this.transactionsRepository.manager.getRepository(BudgetCategory);
      
      // Buscar a categoria da transação
      const sourceCategory = await budgetCategoryRepository.findOne({
        where: { id: categoryId },
        relations: ['group']
      });
      
      if (!sourceCategory) {
        console.warn(`Categoria de origem não encontrada: ${categoryId}`);
        return;
      }

      // Validar se há valor suficiente na categoria de origem
      const currentSourceAmount = Number(sourceCategory.allocatedAmount);
      if (currentSourceAmount < amount) {
        console.warn(`Valor insuficiente na categoria ${sourceCategory.name}. Disponível: ${currentSourceAmount}, Necessário: ${amount}`);
        // Continue but only deduce available amount
        amount = currentSourceAmount;
      }

      // Buscar categoria de pagamento do cartão (múltiplos padrões possíveis)
      const possibleNames = [
        `Pagamento ${account.name}`,
        `${account.name}`,
        account.name.includes('Cartão') ? account.name : `Cartão ${account.name}`
      ];

      let paymentCategory = null;
      for (const possibleName of possibleNames) {
        paymentCategory = await budgetCategoryRepository.findOne({
          where: { 
            name: possibleName,
            group: { monthYear: sourceCategory.group.monthYear } // Mesmo mês
          },
          relations: ['group']
        });
        if (paymentCategory) break;
      }

      if (!paymentCategory) {
        console.warn(`Categoria de pagamento não encontrada para ${account.name}. Tentativas: ${possibleNames.join(', ')}`);
        return;
      }

      // Atualizar categorias com transação atômica
      await budgetCategoryRepository.manager.transaction(async (transactionalEntityManager) => {
        // Deduzir valor da categoria original
        const newSourceAmount = Math.max(0, currentSourceAmount - amount);
        await transactionalEntityManager.update(BudgetCategory, sourceCategory.id, { 
          allocatedAmount: newSourceAmount
        });
        
        // Adicionar valor à categoria de pagamento do cartão
        const currentPaymentAmount = Number(paymentCategory.allocatedAmount);
        const newPaymentAmount = currentPaymentAmount + amount;
        await transactionalEntityManager.update(BudgetCategory, paymentCategory.id, { 
          allocatedAmount: newPaymentAmount
        });
      });

      console.log(`Transferência de orçamento: ${sourceCategory.name} (${currentSourceAmount} -> ${currentSourceAmount - amount}) para ${paymentCategory.name} (${Number(paymentCategory.allocatedAmount)} -> ${Number(paymentCategory.allocatedAmount) + amount})`);

    } catch (error) {
      console.error('Erro ao processar transação de cartão de crédito:', error);
      // Não lançar erro para não impedir a transação principal
    }
  }

  async getCurrentBill(accountId: number, userId: number): Promise<{ currentBill: number; transactions: Transaction[] }> {
    // Verificar se é cartão de crédito do usuário
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, user: { id: userId }, type: AccountType.CREDIT_CARD }
    });

    if (!account) {
      throw new NotFoundException('Cartão de crédito não encontrado');
    }

    // Buscar transações do mês atual
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const transactions = await this.transactionsRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paidBy', 'paidBy')
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth
      })
      .orderBy('transaction.date', 'DESC')
      .getMany();

    const currentBill = transactions.reduce((total, transaction) => 
      total + Number(transaction.amount), 0
    );

    return { currentBill, transactions };
  }
}