import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetGroup } from './entities/budget-group.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CategoryDeletionGuard } from '../common/guards/category-deletion.guard';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetGroup, BudgetCategory, Transaction])],
  controllers: [BudgetsController],
  providers: [BudgetsService, CategoryDeletionGuard],
  exports: [BudgetsService],
})
export class BudgetsModule {}