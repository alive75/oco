import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetGroup } from './entities/budget-group.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(BudgetGroup)
    private budgetGroupsRepository: Repository<BudgetGroup>,
    @InjectRepository(BudgetCategory)
    private budgetCategoriesRepository: Repository<BudgetCategory>,
  ) {}

  async getMonthlyBudget(month: Date) {
    const groups = await this.findGroupsByMonth(month);
    
    // Calcular valores gastos e disponíveis por categoria
    for (const group of groups) {
      for (const category of group.categories) {
        const spent = await this.getCategorySpent(category.id, month);
        (category as any).spent = spent;
        (category as any).available = Number(category.allocatedAmount) - spent;
      }
    }

    const readyToAssign = await this.getReadyToAssign(month);
    
    return {
      groups,
      readyToAssign,
      month,
    };
  }

  async findGroupsByMonth(month: Date): Promise<BudgetGroup[]> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    return this.budgetGroupsRepository.find({
      where: { monthYear: startOfMonth },
      relations: ['categories'],
      order: { createdAt: 'ASC' },
    });
  }

  async createGroup(createGroupDto: CreateGroupDto): Promise<BudgetGroup> {
    const monthYear = new Date(createGroupDto.monthYear);
    const startOfMonth = new Date(monthYear.getFullYear(), monthYear.getMonth(), 1);
    
    const group = this.budgetGroupsRepository.create({
      name: createGroupDto.name,
      monthYear: startOfMonth,
    });

    return this.budgetGroupsRepository.save(group);
  }

  async updateGroup(id: number, updateGroupDto: UpdateGroupDto): Promise<BudgetGroup> {
    const group = await this.budgetGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    Object.assign(group, updateGroupDto);
    if (updateGroupDto.monthYear) {
      const monthYear = new Date(updateGroupDto.monthYear);
      group.monthYear = new Date(monthYear.getFullYear(), monthYear.getMonth(), 1);
    }

    return this.budgetGroupsRepository.save(group);
  }

  async deleteGroup(id: number): Promise<void> {
    const group = await this.budgetGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    await this.budgetGroupsRepository.remove(group);
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<BudgetCategory> {
    const group = await this.budgetGroupsRepository.findOne({ 
      where: { id: createCategoryDto.groupId } 
    });
    
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    const category = this.budgetCategoriesRepository.create({
      name: createCategoryDto.name,
      allocatedAmount: createCategoryDto.allocatedAmount || 0,
      group,
    });

    return this.budgetCategoriesRepository.save(category);
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<BudgetCategory> {
    const category = await this.budgetCategoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (updateCategoryDto.allocatedAmount !== undefined && updateCategoryDto.allocatedAmount < 0) {
      throw new BadRequestException('Valor alocado não pode ser negativo');
    }

    Object.assign(category, updateCategoryDto);
    return this.budgetCategoriesRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.budgetCategoriesRepository.findOne({ 
      where: { id },
      relations: ['transactions']
    });
    
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.transactions && category.transactions.length > 0) {
      throw new BadRequestException('Não é possível deletar categoria com transações');
    }

    await this.budgetCategoriesRepository.remove(category);
  }

  async copyPreviousMonth(currentMonth: Date): Promise<void> {
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const previousGroups = await this.findGroupsByMonth(previousMonth);
    
    for (const previousGroup of previousGroups) {
      // Verificar se já existe grupo para o mês atual
      const existingGroup = await this.budgetGroupsRepository.findOne({
        where: { name: previousGroup.name, monthYear: currentMonthStart }
      });

      if (!existingGroup) {
        const newGroup = this.budgetGroupsRepository.create({
          name: previousGroup.name,
          monthYear: currentMonthStart,
        });
        const savedGroup = await this.budgetGroupsRepository.save(newGroup);

        // Copiar categorias
        for (const previousCategory of previousGroup.categories) {
          const newCategory = this.budgetCategoriesRepository.create({
            name: previousCategory.name,
            allocatedAmount: previousCategory.allocatedAmount,
            group: savedGroup,
          });
          await this.budgetCategoriesRepository.save(newCategory);
        }
      }
    }
  }

  async getReadyToAssign(month: Date): Promise<number> {
    // TODO: Implementar cálculo baseado na renda total - soma das alocações
    // Por enquanto, retornar 0
    const groups = await this.findGroupsByMonth(month);
    let totalAllocated = 0;
    
    for (const group of groups) {
      for (const category of group.categories) {
        totalAllocated += Number(category.allocatedAmount);
      }
    }

    // Assumindo renda fixa de R$ 5000 para desenvolvimento
    // TODO: Implementar sistema de renda dinâmica
    const totalIncome = 5000;
    return totalIncome - totalAllocated;
  }

  async getCategorySpent(categoryId: number, month?: Date): Promise<number> {
    const { Transaction } = await import('../transactions/entities/transaction.entity');
    const transactionRepository = this.budgetGroupsRepository.manager.getRepository(Transaction);
    
    const query = transactionRepository.createQueryBuilder('transaction')
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

  async getAvailableAmount(categoryId: number): Promise<number> {
    const category = await this.budgetCategoriesRepository.findOne({
      where: { id: categoryId }
    });
    
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const spent = await this.getCategorySpent(categoryId);
    return Number(category.allocatedAmount) - spent;
  }
}