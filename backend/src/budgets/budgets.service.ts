import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, IsNull } from 'typeorm';
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
    
    // Calcular valores gastos e disponíveis por categoria, e total alocado por grupo
    for (const group of groups) {
      let totalAllocated = 0;
      
      for (const category of group.categories) {
        const spent = await this.getCategorySpent(category.id, month);
        (category as any).spent = spent;
        
        // Para categoria especial "Pronto para Atribuir", calcular baseado nas transações reais
        if (category.isSpecial && category.name === 'Pronto para Atribuir') {
          const realAmount = await this.calculateReadyToAssignFromTransactions(month);
          (category as any).allocatedAmount = realAmount;
          (category as any).available = realAmount - spent;
          totalAllocated += realAmount;
        } else {
          (category as any).available = Number(category.allocatedAmount) - spent;
          totalAllocated += Number(category.allocatedAmount);
        }
      }
      
      (group as any).totalAllocated = totalAllocated;
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

    const savedGroup = await this.budgetGroupsRepository.save(group);
    
    // Replicar o grupo para todos os outros meses que já existem
    await this.replicateGroupToAllMonths(createGroupDto.name, startOfMonth);
    
    return savedGroup;
  }

  async updateGroup(id: number, updateGroupDto: UpdateGroupDto): Promise<BudgetGroup> {
    const group = await this.budgetGroupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Não permitir editar o grupo "Sistema"
    if (group.name === 'Sistema') {
      throw new BadRequestException('Não é possível editar o grupo "Sistema"');
    }

    const oldName = group.name;
    
    // Se o nome está sendo alterado, atualizar em todos os meses
    if (updateGroupDto.name && updateGroupDto.name !== oldName) {
      await this.updateGroupInAllMonths(oldName, updateGroupDto.name);
    }

    // Atualizar o grupo atual
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

    // Não permitir deletar o grupo "Sistema"
    if (group.name === 'Sistema') {
      throw new BadRequestException('Não é possível deletar o grupo "Sistema"');
    }

    // Deletar todos os grupos com o mesmo nome em todos os meses
    await this.deleteGroupFromAllMonths(group.name);
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<BudgetCategory> {
    const group = await this.budgetGroupsRepository.findOne({ 
      where: { id: createCategoryDto.groupId } 
    });
    
    if (!group) {
      throw new NotFoundException('Grupo não encontrado');
    }

    // Criar a categoria no grupo especificado
    const category = this.budgetCategoriesRepository.create({
      name: createCategoryDto.name,
      allocatedAmount: createCategoryDto.allocatedAmount || 0,
      isSpecial: createCategoryDto.isSpecial || false,
      group,
    });

    const savedCategory = await this.budgetCategoriesRepository.save(category);
    
    // Replicar a categoria para todos os grupos com o mesmo nome em outros meses
    await this.replicateCategoryToAllGroupsWithSameName(group.name, createCategoryDto);
    
    return savedCategory;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<BudgetCategory> {
    const category = await this.budgetCategoriesRepository.findOne({ 
      where: { id },
      relations: ['group']
    });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (updateCategoryDto.allocatedAmount !== undefined && updateCategoryDto.allocatedAmount < 0) {
      throw new BadRequestException('Valor alocado não pode ser negativo');
    }

    // Não permitir alterar categoria especial "Pronto para Atribuir"
    if (category.isSpecial && category.name === 'Pronto para Atribuir') {
      throw new BadRequestException('Não é possível editar a categoria "Pronto para Atribuir"');
    }

    const oldName = category.name;
    
    // Se o nome está sendo alterado, atualizar em todas as categorias com mesmo nome no mesmo grupo em outros meses
    if (updateCategoryDto.name && updateCategoryDto.name !== oldName) {
      await this.updateCategoryInAllGroupsWithSameName(category.group.name, oldName, updateCategoryDto.name);
    }

    Object.assign(category, updateCategoryDto);
    return this.budgetCategoriesRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.budgetCategoriesRepository.findOne({ 
      where: { id },
      relations: ['transactions', 'group']
    });
    
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Não permitir deletar categoria especial "Pronto para Atribuir"
    if (category.isSpecial && category.name === 'Pronto para Atribuir') {
      throw new BadRequestException('Não é possível deletar a categoria "Pronto para Atribuir"');
    }

    // Deletar todas as categorias com o mesmo nome nos grupos com mesmo nome em todos os meses
    await this.deleteCategoryFromAllGroupsWithSameName(category.group.name, category.name);
  }

  async copyPreviousMonth(currentMonth: Date): Promise<void> {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Ao invés de copiar apenas do mês anterior, vamos replicar todos os grupos e categorias únicos existentes
    await this.replicateAllGroupsAndCategoriesToNewMonth(currentMonthStart);
  }

  private async replicateAllGroupsAndCategoriesToNewMonth(targetMonth: Date): Promise<void> {
    // Buscar todos os grupos únicos (por nome)
    const uniqueGroupNames = await this.budgetGroupsRepository
      .createQueryBuilder('group')
      .select('DISTINCT group.name', 'name')
      .getRawMany();

    for (const groupData of uniqueGroupNames) {
      const groupName = groupData.name;
      
      // Verificar se já existe um grupo com este nome no mês de destino
      const existingGroup = await this.budgetGroupsRepository.findOne({
        where: { name: groupName, monthYear: targetMonth }
      });

      if (!existingGroup) {
        // Criar o grupo no mês de destino
        const newGroup = this.budgetGroupsRepository.create({
          name: groupName,
          monthYear: targetMonth,
        });
        const savedGroup = await this.budgetGroupsRepository.save(newGroup);

        // Buscar todas as categorias únicas deste grupo (de qualquer mês)
        const uniqueCategoriesInGroup = await this.budgetCategoriesRepository
          .createQueryBuilder('category')
          .innerJoin('category.group', 'group')
          .select(['DISTINCT category.name as name', 'category.isSpecial as isSpecial'])
          .where('group.name = :groupName', { groupName })
          .getRawMany();

        // Criar todas as categorias únicas no novo grupo
        for (const categoryData of uniqueCategoriesInGroup) {
          const newCategory = this.budgetCategoriesRepository.create({
            name: categoryData.name,
            allocatedAmount: 0, // Começar com 0 no novo mês
            isSpecial: categoryData.isSpecial,
            group: savedGroup,
          });
          await this.budgetCategoriesRepository.save(newCategory);
        }
      }
    }
  }

  async getReadyToAssign(month: Date): Promise<number> {
    // Calcular total recebido no mês a partir das transações reais da categoria "Pronto para Atribuir"
    const readyToAssignCategory = await this.findOrCreateReadyToAssignCategory(month);
    const { Transaction } = await import('../transactions/entities/transaction.entity');
    const transactionRepository = this.budgetGroupsRepository.manager.getRepository(Transaction);
    
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Buscar transações da categoria "Pronto para Atribuir" (receitas)
    const incomeTransactions = await transactionRepository.find({
      where: { 
        category: { id: readyToAssignCategory.id },
        date: Between(startOfMonth, endOfMonth)
      }
    });
    
    // Somar receitas (valores negativos se tornam positivos)
    const totalIncome = incomeTransactions.reduce((sum, transaction) => 
      sum + Math.abs(Number(transaction.amount)), 0
    );
    
    // Somar todas as alocações de outras categorias
    const groups = await this.findGroupsByMonth(month);
    let totalAllocated = 0;
    
    for (const group of groups) {
      for (const category of group.categories) {
        // Não contar a própria categoria "Pronto para Atribuir"
        if (!category.isSpecial) {
          totalAllocated += Number(category.allocatedAmount);
        }
      }
    }
    
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

  async findOrCreateReadyToAssignCategory(month: Date): Promise<BudgetCategory> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    
    // Usar transação para evitar race conditions
    return await this.budgetCategoriesRepository.manager.transaction(async (entityManager) => {
      // Procurar categoria "Pronto para Atribuir" existente com lock
      const existingCategory = await entityManager
        .createQueryBuilder(BudgetCategory, 'category')
        .innerJoin('category.group', 'group')
        .where('category.name = :name', { name: 'Pronto para Atribuir' })
        .andWhere('category.isSpecial = :isSpecial', { isSpecial: true })
        .andWhere('group.monthYear = :monthYear', { monthYear: startOfMonth })
        .setLock('pessimistic_write')
        .getOne();

      if (existingCategory) {
        return existingCategory;
      }

      // Procurar ou criar grupo "Sistema" com lock
      let systemGroup = await entityManager
        .createQueryBuilder(BudgetGroup, 'group')
        .where('group.name = :name', { name: 'Sistema' })
        .andWhere('group.monthYear = :monthYear', { monthYear: startOfMonth })
        .setLock('pessimistic_write')
        .getOne();

      if (!systemGroup) {
        // Verificar novamente se não foi criado por outra transação
        systemGroup = await entityManager.findOne(BudgetGroup, {
          where: { name: 'Sistema', monthYear: startOfMonth }
        });
        
        if (!systemGroup) {
          systemGroup = entityManager.create(BudgetGroup, {
            name: 'Sistema',
            monthYear: startOfMonth,
          });
          systemGroup = await entityManager.save(systemGroup);
        }
      }

      // Verificar novamente se a categoria não foi criada por outra transação
      const doubleCheckCategory = await entityManager.findOne(BudgetCategory, {
        where: { 
          name: 'Pronto para Atribuir', 
          isSpecial: true, 
          group: { id: systemGroup.id } 
        }
      });
      
      if (doubleCheckCategory) {
        return doubleCheckCategory;
      }

      // Criar categoria "Pronto para Atribuir"
      const readyToAssignCategory = entityManager.create(BudgetCategory, {
        name: 'Pronto para Atribuir',
        allocatedAmount: 0,
        isSpecial: true,
        group: systemGroup,
      });

      return await entityManager.save(readyToAssignCategory);
    });
  }

  async addToReadyToAssign(amount: number, month: Date): Promise<void> {
    const readyToAssignCategory = await this.findOrCreateReadyToAssignCategory(month);
    const currentAmount = Number(readyToAssignCategory.allocatedAmount);
    readyToAssignCategory.allocatedAmount = currentAmount + amount;
    await this.budgetCategoriesRepository.save(readyToAssignCategory);
  }

  private async calculateReadyToAssignFromTransactions(month: Date): Promise<number> {
    const { Transaction } = await import('../transactions/entities/transaction.entity');
    const transactionRepository = this.budgetGroupsRepository.manager.getRepository(Transaction);
    
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Buscar categoria "Pronto para Atribuir" para incluir transações atribuídas a ela
    const readyToAssignCategory = await this.findOrCreateReadyToAssignCategory(month);
    
    // Buscar transações de duas fontes:
    // 1. Receitas SEM categoria (categoryId NULL) - estas são "Pronto para Atribuir" por padrão
    // 2. Transações COM categoria "Pronto para Atribuir" atribuída
    const [incomeWithoutCategory, incomeWithCategory] = await Promise.all([
      transactionRepository.find({
        where: { 
          category: IsNull(), // Receitas sem categoria atribuída
          date: Between(startOfMonth, endOfMonth)
        }
      }),
      transactionRepository.find({
        where: { 
          category: { id: readyToAssignCategory.id }, // Transações atribuídas à categoria
          date: Between(startOfMonth, endOfMonth)
        }
      })
    ]);
    
    // Combinar e processar todas as transações
    const allTransactions = [...incomeWithoutCategory, ...incomeWithCategory];
    
    // Somar receitas (converter valores negativos para positivos)
    return allTransactions
      .filter(t => Number(t.amount) < 0) // Apenas receitas (valores negativos)
      .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
  }

  async getReadyToAssignTransactions(month: Date): Promise<any> {
    const readyToAssignCategory = await this.findOrCreateReadyToAssignCategory(month);
    const { Transaction } = await import('../transactions/entities/transaction.entity');
    const transactionRepository = this.budgetGroupsRepository.manager.getRepository(Transaction);
    
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const transactions = await transactionRepository.find({
      where: { 
        category: { id: readyToAssignCategory.id },
        date: Between(startOfMonth, endOfMonth)
      },
      relations: ['account', 'paidBy'],
      order: { date: 'DESC' }
    });

    const total = transactions.reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
    
    return {
      total,
      transactions,
      category: {
        id: readyToAssignCategory.id,
        name: readyToAssignCategory.name,
        allocatedAmount: readyToAssignCategory.allocatedAmount
      }
    };
  }

  async fixDuplicateSystemGroups(): Promise<{ message: string; fixed: number }> {
    let fixedGroupsCount = 0;
    let fixedCategoriesCount = 0;
    
    // Usar transação para garantir consistência
    await this.budgetGroupsRepository.manager.transaction(async (entityManager) => {
      // 1. Corrigir grupos "Sistema" duplicados
      const duplicateMonths = await entityManager
        .createQueryBuilder(BudgetGroup, 'group')
        .select('group.monthYear')
        .where('group.name = :name', { name: 'Sistema' })
        .groupBy('group.monthYear')
        .having('COUNT(group.id) > 1')
        .getRawMany();

      for (const { group_monthYear } of duplicateMonths) {
        // Encontrar todos os grupos "Sistema" deste mês
        const systemGroups = await entityManager.find(BudgetGroup, {
          where: { name: 'Sistema', monthYear: group_monthYear },
          order: { createdAt: 'ASC' }
        });

        if (systemGroups.length > 1) {
          // Manter o primeiro (mais antigo) e remover os outros
          const [keepGroup, ...duplicateGroups] = systemGroups;

          for (const duplicateGroup of duplicateGroups) {
            // Mover todas as categorias do grupo duplicado para o grupo principal
            await entityManager
              .createQueryBuilder()
              .update(BudgetCategory)
              .set({ group: keepGroup })
              .where('group.id = :duplicateId', { duplicateId: duplicateGroup.id })
              .execute();

            // Remover o grupo duplicado
            await entityManager.remove(duplicateGroup);
            fixedGroupsCount++;
          }
        }
      }

      // 2. Corrigir categorias "Pronto para Atribuir" duplicadas
      const systemGroupsWithCategories = await entityManager.find(BudgetGroup, {
        where: { name: 'Sistema' },
        relations: ['categories']
      });

      for (const group of systemGroupsWithCategories) {
        // Encontrar categorias "Pronto para Atribuir" duplicadas no mesmo grupo
        const readyToAssignCategories = group.categories.filter(cat => 
          cat.name === 'Pronto para Atribuir' && cat.isSpecial
        );

        if (readyToAssignCategories.length > 1) {
          // Manter a primeira categoria e remover as outras
          const [keepCategory, ...duplicateCategories] = readyToAssignCategories
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          // Somar os valores das categorias duplicadas na categoria mantida
          let totalAmount = Number(keepCategory.allocatedAmount);
          
          for (const duplicateCategory of duplicateCategories) {
            totalAmount += Number(duplicateCategory.allocatedAmount);
            
            // Mover transações da categoria duplicada para a categoria principal
            const { Transaction } = await import('../transactions/entities/transaction.entity');
            await entityManager.query(
              'UPDATE transactions SET "categoryId" = $1 WHERE "categoryId" = $2',
              [keepCategory.id, duplicateCategory.id]
            );

            // Remover a categoria duplicada
            await entityManager.remove(duplicateCategory);
            fixedCategoriesCount++;
          }

          // Atualizar o valor total na categoria mantida
          keepCategory.allocatedAmount = totalAmount;
          await entityManager.save(keepCategory);
        }
      }
    });

    return {
      message: `Limpeza concluída. ${fixedGroupsCount} grupos "Sistema" e ${fixedCategoriesCount} categorias "Pronto para Atribuir" duplicadas foram removidas.`,
      fixed: fixedGroupsCount + fixedCategoriesCount
    };
  }

  private async replicateGroupToAllMonths(groupName: string, excludeMonth: Date): Promise<void> {
    // Buscar todos os meses únicos que já existem (exceto o mês atual)
    const existingMonths = await this.budgetGroupsRepository
      .createQueryBuilder('group')
      .select('DISTINCT group.monthYear', 'monthYear')
      .where('group.monthYear != :excludeMonth', { excludeMonth })
      .getRawMany();
    
    for (const monthData of existingMonths) {
      const monthYear = monthData.monthYear;
      
      // Verificar se já existe um grupo com esse nome no mês
      const existingGroup = await this.budgetGroupsRepository.findOne({
        where: { name: groupName, monthYear }
      });
      
      if (!existingGroup) {
        // Criar o grupo para este mês
        const newGroup = this.budgetGroupsRepository.create({
          name: groupName,
          monthYear,
        });
        await this.budgetGroupsRepository.save(newGroup);
      }
    }
  }

  async syncGroupsAcrossMonths(): Promise<{ message: string; created: number }> {
    let createdGroupsCount = 0;
    
    // Buscar todos os meses únicos
    const allMonths = await this.budgetGroupsRepository
      .createQueryBuilder('group')
      .select('DISTINCT group.monthYear', 'monthYear')
      .orderBy('group.monthYear', 'ASC')
      .getRawMany();
    
    // Buscar todos os nomes de grupos únicos
    const allGroupNames = await this.budgetGroupsRepository
      .createQueryBuilder('group')
      .select('DISTINCT group.name', 'name')
      .where('group.name != :systemName', { systemName: 'Sistema' }) // Excluir "Sistema" pois já é tratado automaticamente
      .getRawMany();
    
    // Para cada combinação de mês e nome de grupo, verificar se existe
    for (const monthData of allMonths) {
      for (const groupData of allGroupNames) {
        const monthYear = monthData.monthYear;
        const groupName = groupData.name;
        
        // Verificar se já existe
        const existingGroup = await this.budgetGroupsRepository.findOne({
          where: { name: groupName, monthYear }
        });
        
        if (!existingGroup) {
          // Criar o grupo faltante
          const newGroup = this.budgetGroupsRepository.create({
            name: groupName,
            monthYear,
          });
          await this.budgetGroupsRepository.save(newGroup);
          createdGroupsCount++;
        }
      }
    }
    
    return {
      message: `Sincronização concluída. ${createdGroupsCount} grupos foram criados para manter consistência entre todos os meses.`,
      created: createdGroupsCount
    };
  }

  private async deleteGroupFromAllMonths(groupName: string): Promise<void> {
    // Buscar todos os grupos com este nome
    const groupsToDelete = await this.budgetGroupsRepository.find({
      where: { name: groupName },
      relations: ['categories']
    });

    // Verificar se algum grupo tem categorias com transações
    for (const group of groupsToDelete) {
      for (const category of group.categories) {
        // Verificar se a categoria tem transações
        const categoryWithTransactions = await this.budgetCategoriesRepository.findOne({
          where: { id: category.id },
          relations: ['transactions']
        });
        
        if (categoryWithTransactions?.transactions && categoryWithTransactions.transactions.length > 0) {
          throw new BadRequestException(`Não é possível deletar o grupo "${groupName}" pois a categoria "${category.name}" possui transações associadas`);
        }
      }
    }

    // Se chegou até aqui, pode deletar todos os grupos
    for (const group of groupsToDelete) {
      await this.budgetGroupsRepository.remove(group);
    }
  }

  private async updateGroupInAllMonths(groupName: string, newName: string): Promise<void> {
    // Buscar todos os grupos com este nome
    const groupsToUpdate = await this.budgetGroupsRepository.find({
      where: { name: groupName }
    });

    // Atualizar o nome em todos os meses
    for (const group of groupsToUpdate) {
      group.name = newName;
      await this.budgetGroupsRepository.save(group);
    }
  }

  private async replicateCategoryToAllGroupsWithSameName(groupName: string, createCategoryDto: CreateCategoryDto): Promise<void> {
    // Buscar todos os grupos com o mesmo nome em outros meses
    const allGroupsWithSameName = await this.budgetGroupsRepository.find({
      where: { name: groupName },
      relations: ['categories']
    });

    for (const group of allGroupsWithSameName) {
      // Verificar se já existe uma categoria com este nome no grupo
      const existingCategory = group.categories.find(cat => cat.name === createCategoryDto.name);
      
      if (!existingCategory) {
        // Criar a categoria neste grupo
        const newCategory = this.budgetCategoriesRepository.create({
          name: createCategoryDto.name,
          allocatedAmount: createCategoryDto.allocatedAmount || 0,
          isSpecial: createCategoryDto.isSpecial || false,
          group,
        });
        await this.budgetCategoriesRepository.save(newCategory);
      }
    }
  }

  private async deleteCategoryFromAllGroupsWithSameName(groupName: string, categoryName: string): Promise<void> {
    // Buscar todas as categorias com este nome nos grupos com mesmo nome
    const categoriesToDelete = await this.budgetCategoriesRepository
      .createQueryBuilder('category')
      .innerJoin('category.group', 'group')
      .where('group.name = :groupName', { groupName })
      .andWhere('category.name = :categoryName', { categoryName })
      .leftJoinAndSelect('category.transactions', 'transactions')
      .getMany();

    // Verificar se alguma categoria tem transações
    for (const category of categoriesToDelete) {
      if (category.transactions && category.transactions.length > 0) {
        throw new BadRequestException(`Não é possível deletar a categoria "${categoryName}" pois possui transações associadas`);
      }
    }

    // Se chegou até aqui, pode deletar todas as categorias
    for (const category of categoriesToDelete) {
      await this.budgetCategoriesRepository.remove(category);
    }
  }

  private async updateCategoryInAllGroupsWithSameName(groupName: string, oldCategoryName: string, newCategoryName: string): Promise<void> {
    // Buscar todas as categorias com este nome nos grupos com mesmo nome
    const categoriesToUpdate = await this.budgetCategoriesRepository
      .createQueryBuilder('category')
      .innerJoin('category.group', 'group')
      .where('group.name = :groupName', { groupName })
      .andWhere('category.name = :categoryName', { categoryName: oldCategoryName })
      .getMany();

    // Atualizar o nome em todas as categorias
    for (const category of categoriesToUpdate) {
      category.name = newCategoryName;
      await this.budgetCategoriesRepository.save(category);
    }
  }
}