import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { BudgetsService } from '../budgets/budgets.service';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: ['user'],
    });
  }

  async findByUser(userId: number): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    return account;
  }

  async create(createAccountDto: CreateAccountDto, userId: number): Promise<Account> {
    const account = this.accountsRepository.create({
      ...createAccountDto,
      balance: createAccountDto.balance || 0,
      user: { id: userId },
    });

    const savedAccount = await this.accountsRepository.save(account);

    // Se for cartão de crédito, criar categoria automática para pagamento
    if (createAccountDto.type === AccountType.CREDIT_CARD) {
      await this.createCreditCardCategory(savedAccount, userId);
    }
    
    return savedAccount;
  }

  private async createCreditCardCategory(account: Account, userId: number): Promise<void> {
    try {
      // Importar BudgetsService dinamicamente para evitar dependência circular
      const { BudgetsService } = await import('../budgets/budgets.service');
      const { BudgetGroup } = await import('../budgets/entities/budget-group.entity');
      const { BudgetCategory } = await import('../budgets/entities/budget-category.entity');
      
      // Injeção manual dos repositories necessários
      const budgetGroupRepository = this.accountsRepository.manager.getRepository(BudgetGroup);
      const budgetCategoryRepository = this.accountsRepository.manager.getRepository(BudgetCategory);
      
      const budgetsService = new BudgetsService(budgetGroupRepository, budgetCategoryRepository);

      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Buscar ou criar grupo "Cartões de Crédito"
      let creditCardGroup = await budgetGroupRepository.findOne({
        where: { name: 'Cartões de Crédito', monthYear: startOfMonth }
      });

      if (!creditCardGroup) {
        creditCardGroup = await budgetsService.createGroup({
          name: 'Cartões de Crédito',
          monthYear: startOfMonth.toISOString().split('T')[0]
        });
      }

      // Criar categoria para este cartão
      await budgetsService.createCategory({
        name: `Pagamento ${account.name}`,
        allocatedAmount: 0,
        groupId: creditCardGroup.id
      });

    } catch (error) {
      console.error('Erro ao criar categoria para cartão de crédito:', error);
      // Não falhar a criação da conta se não conseguir criar a categoria
    }
  }

  private async removeCreditCardCategory(accountName: string): Promise<void> {
    try {
      // Importar entidades dinamicamente para evitar dependência circular
      const { BudgetCategory } = await import('../budgets/entities/budget-category.entity');
      const { BudgetGroup } = await import('../budgets/entities/budget-group.entity');
      
      const budgetCategoryRepository = this.accountsRepository.manager.getRepository(BudgetCategory);
      const budgetGroupRepository = this.accountsRepository.manager.getRepository(BudgetGroup);

      // Buscar categoria com o nome "Pagamento [Nome do Cartão]"
      const categoryName = `Pagamento ${accountName}`;
      const category = await budgetCategoryRepository.findOne({
        where: { name: categoryName },
        relations: ['group']
      });

      if (category) {
        // Verificar se há transações vinculadas à categoria
        const transactionCount = await this.transactionsRepository.count({
          where: { category: { id: category.id } }
        });

        if (transactionCount > 0) {
          console.warn(`Categoria "${categoryName}" possui ${transactionCount} transações vinculadas. Não será removida automaticamente.`);
          return;
        }

        const group = category.group;
        
        // Remover a categoria
        await budgetCategoryRepository.remove(category);

        // Se o grupo ficou vazio e é "Cartões de Crédito", considerar remover também
        const remainingCategories = await budgetCategoryRepository.count({
          where: { group: { id: group.id } }
        });

        if (remainingCategories === 0 && group.name === 'Cartões de Crédito') {
          await budgetGroupRepository.remove(group);
        }
      }

    } catch (error) {
      console.error('Erro ao remover categoria do cartão de crédito:', error);
      // Não falhar a exclusão da conta se não conseguir remover a categoria
    }
  }

  async update(id: number, updateAccountDto: UpdateAccountDto, userId: number): Promise<Account> {
    const account = await this.findOne(id, userId);
    
    Object.assign(account, updateAccountDto);
    return this.accountsRepository.save(account);
  }

  async remove(id: number, userId: number): Promise<void> {
    const account = await this.findOne(id, userId);
    
    // Verificar se há transações vinculadas antes de deletar
    const transactionCount = await this.transactionsRepository.count({
      where: { account: { id: id } }
    });
    
    if (transactionCount > 0) {
      throw new BadRequestException(
        `Não é possível deletar a conta "${account.name}" pois ela possui ${transactionCount} transação${transactionCount > 1 ? 'ões' : ''} vinculada${transactionCount > 1 ? 's' : ''}. Exclua as transações primeiro ou transfira-as para outra conta.`
      );
    }
    
    // Se for cartão de crédito, remover categoria correspondente
    if (account.type === AccountType.CREDIT_CARD) {
      await this.removeCreditCardCategory(account.name);
    }
    
    await this.accountsRepository.remove(account);
  }

  async updateBalance(id: number, newBalance: number): Promise<void> {
    await this.accountsRepository.update(id, { balance: newBalance });
  }

  /**
   * Remove categorias órfãs de cartão de crédito (categorias que não têm conta correspondente)
   */
  async cleanupOrphanedCreditCardCategories(): Promise<{ removed: number }> {
    try {
      // Importar entidades dinamicamente
      const { BudgetCategory } = await import('../budgets/entities/budget-category.entity');
      const { BudgetGroup } = await import('../budgets/entities/budget-group.entity');
      
      const budgetCategoryRepository = this.accountsRepository.manager.getRepository(BudgetCategory);
      const budgetGroupRepository = this.accountsRepository.manager.getRepository(BudgetGroup);

      // Buscar todos os cartões de crédito existentes
      const creditCardAccounts = await this.accountsRepository.find({
        where: { type: AccountType.CREDIT_CARD }
      });

      const existingAccountNames = creditCardAccounts.map(account => `Pagamento ${account.name}`);

      // Buscar categorias do grupo "Cartões de Crédito" que começam com "Pagamento"
      const creditCardCategories = await budgetCategoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.group', 'group')
        .where('group.name = :groupName', { groupName: 'Cartões de Crédito' })
        .andWhere('category.name LIKE :pattern', { pattern: 'Pagamento %' })
        .getMany();

      let removedCount = 0;

      // Remover categorias órfãs (sem conta correspondente)
      for (const category of creditCardCategories) {
        if (!existingAccountNames.includes(category.name)) {
          // Verificar se há transações vinculadas
          const transactionCount = await this.transactionsRepository.count({
            where: { category: { id: category.id } }
          });

          if (transactionCount === 0) {
            await budgetCategoryRepository.remove(category);
            removedCount++;
            console.log(`Categoria órfã removida: ${category.name}`);
          } else {
            console.warn(`Categoria órfã "${category.name}" possui ${transactionCount} transações vinculadas. Não foi removida.`);
          }
        }
      }

      // Verificar se o grupo "Cartões de Crédito" ficou vazio
      const remainingCategories = await budgetCategoryRepository.count({
        where: { group: { name: 'Cartões de Crédito' } }
      });

      if (remainingCategories === 0) {
        const emptyGroup = await budgetGroupRepository.findOne({
          where: { name: 'Cartões de Crédito' }
        });
        if (emptyGroup) {
          await budgetGroupRepository.remove(emptyGroup);
          console.log('Grupo "Cartões de Crédito" vazio foi removido');
        }
      }

      return { removed: removedCount };

    } catch (error) {
      console.error('Erro ao limpar categorias órfãs de cartão de crédito:', error);
      throw error;
    }
  }
}