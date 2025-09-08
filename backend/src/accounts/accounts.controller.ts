import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta' })
  create(@Body() createAccountDto: CreateAccountDto, @Request() req) {
    return this.accountsService.create(createAccountDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas do usuário logado' })
  findAll(@Request() req) {
    return this.accountsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter conta por ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.accountsService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @Request() req) {
    return this.accountsService.update(+id, updateAccountDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar conta' })
  remove(@Param('id') id: string, @Request() req) {
    return this.accountsService.remove(+id, req.user.userId);
  }

  @Post('cleanup-orphaned-credit-cards')
  @ApiOperation({ summary: 'Limpar categorias órfãs de cartão de crédito' })
  cleanupOrphanedCreditCards() {
    return this.accountsService.cleanupOrphanedCreditCardCategories();
  }
}