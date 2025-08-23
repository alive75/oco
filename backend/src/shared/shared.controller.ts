import { Controller, Get, Post, UseGuards, Query, Request } from '@nestjs/common';
import { SharedService } from './shared.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('shared')
@Controller('shared')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SharedController {
  constructor(private readonly sharedService: SharedService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Obter balanço mensal de despesas compartilhadas' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  async getBalance(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.sharedService.getMonthlyBalance(targetMonth);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Listar transações compartilhadas do mês' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  async getTransactions(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.sharedService.getSharedTransactions(targetMonth);
  }

  @Post('settle')
  @ApiOperation({ summary: 'Marcar despesas como quitadas (cria transferência automática)' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  async settle(@Request() req, @Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.sharedService.markAsSettled(targetMonth, req.user.userId);
  }

  @Get('report')
  @ApiOperation({ summary: 'Relatório detalhado de despesas compartilhadas' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  async getDetailedReport(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.sharedService.getDetailedSharedReport(targetMonth);
  }
}