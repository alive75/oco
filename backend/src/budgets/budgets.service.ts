import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetGroup } from './entities/budget-group.entity';
import { BudgetCategory } from './entities/budget-category.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(BudgetGroup)
    private budgetGroupsRepository: Repository<BudgetGroup>,
    @InjectRepository(BudgetCategory)
    private budgetCategoriesRepository: Repository<BudgetCategory>,
  ) {}

  async findGroupsByMonth(month: Date): Promise<BudgetGroup[]> {
    return this.budgetGroupsRepository.find({
      where: { monthYear: month },
      relations: ['categories'],
    });
  }
}