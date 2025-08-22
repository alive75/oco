import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetGroup } from './entities/budget-group.entity';
import { BudgetCategory } from './entities/budget-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetGroup, BudgetCategory])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}