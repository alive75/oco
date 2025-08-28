import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, UsePipes, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionOwnershipGuard } from '../common/guards/transaction-ownership.guard';
import { BusinessValidationPipe } from '../common/pipes/business-validation.pipe';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova transação' })
  @UsePipes(BusinessValidationPipe)
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    return this.transactionsService.create(createTransactionDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações com filtros' })
  findAll(@Query() filters: TransactionFiltersDto) {
    return this.transactionsService.findAll(filters);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Listar transações compartilhadas' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  getSharedTransactions(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.transactionsService.getSharedTransactions(targetMonth);
  }

  @Get('search-payees')
  @ApiOperation({ summary: 'Buscar pagantes únicos' })
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca para pagantes' })
  async searchPayees(@Query('q') query: string, @Request() req): Promise<string[]> {
    return await this.transactionsService.searchPayees(query, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter transação por ID' })
  findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('ID da transação deve ser um número válido');
    }
    return this.transactionsService.findOne(numericId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  @UseGuards(TransactionOwnershipGuard)
  @UsePipes(BusinessValidationPipe)
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto, @Request() req) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('ID da transação deve ser um número válido');
    }
    return this.transactionsService.update(numericId, updateTransactionDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar transação' })
  @UseGuards(TransactionOwnershipGuard)
  remove(@Param('id') id: string, @Request() req) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new BadRequestException('ID da transação deve ser um número válido');
    }
    return this.transactionsService.remove(numericId, req.user.userId);
  }

  @Get('credit-card/:accountId/current-bill')
  @ApiOperation({ summary: 'Obter fatura atual do cartão de crédito' })
  getCurrentBill(@Param('accountId') accountId: string, @Request() req) {
    const numericAccountId = parseInt(accountId, 10);
    if (isNaN(numericAccountId) || numericAccountId <= 0) {
      throw new BadRequestException('ID da conta deve ser um número válido');
    }
    return this.transactionsService.getCurrentBill(numericAccountId, req.user.userId);
  }
}