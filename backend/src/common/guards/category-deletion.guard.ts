import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetCategory } from '../../budgets/entities/budget-category.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Injectable()
export class CategoryDeletionGuard implements CanActivate {
  constructor(
    @InjectRepository(BudgetCategory)
    private budgetCategoriesRepository: Repository<BudgetCategory>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const categoryId = parseInt(request.params.id);

    if (!categoryId) {
      throw new BadRequestException('ID da categoria inválido');
    }

    // Verificar se a categoria existe
    const category = await this.budgetCategoriesRepository.findOne({
      where: { id: categoryId }
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    // Verificar se há transações vinculadas
    const transactionCount = await this.transactionsRepository.count({
      where: { category: { id: categoryId } }
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        `Não é possível deletar a categoria "${category.name}" pois ela possui ${transactionCount} transação(ões) vinculada(s)`
      );
    }

    return true;
  }
}