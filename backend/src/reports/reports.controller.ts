import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Resumo mensal de gastos e orçamento' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  getMonthlySummary(@Request() req, @Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.reportsService.getMonthlySummary(targetMonth, req.user.userId);
  }

  @Get('accounts-balance')
  @ApiOperation({ summary: 'Saldo de todas as contas por tipo' })
  getAccountsBalance(@Request() req) {
    return this.reportsService.getAccountsBalance(req.user.userId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Fluxo de caixa por período' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final YYYY-MM-DD' })
  getCashFlow(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const currentMonth = new Date();
    const start = startDate ? new Date(startDate) : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return this.reportsService.getCashFlow(start, end, req.user.userId);
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Resumo para o dashboard' })
  getDashboardSummary(@Request() req) {
    return this.reportsService.getDashboardSummary(req.user.userId);
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Transações recentes' })
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de transações' })
  getRecentTransactions(@Request() req, @Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    return this.reportsService.getRecentTransactions(req.user.userId, limitNumber);
  }
}