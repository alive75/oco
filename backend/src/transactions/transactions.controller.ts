import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, UsePipes } from '@nestjs/common';
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

  @Get(':id')
  @ApiOperation({ summary: 'Obter transação por ID' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  @UseGuards(TransactionOwnershipGuard)
  @UsePipes(BusinessValidationPipe)
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto, @Request() req) {
    return this.transactionsService.update(+id, updateTransactionDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar transação' })
  @UseGuards(TransactionOwnershipGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.transactionsService.remove(+id, req.user.userId);
  }

  @Get('credit-card/:accountId/current-bill')
  @ApiOperation({ summary: 'Obter fatura atual do cartão de crédito' })
  getCurrentBill(@Param('accountId') accountId: string, @Request() req) {
    return this.transactionsService.getCurrentBill(+accountId, req.user.userId);
  }
}