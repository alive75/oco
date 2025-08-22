import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByMonth(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.budgetsService.findGroupsByMonth(targetMonth);
  }
}