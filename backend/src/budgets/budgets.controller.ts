import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UsePipes } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryDeletionGuard } from '../common/guards/category-deletion.guard';
import { BusinessValidationPipe } from '../common/pipes/business-validation.pipe';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter estrutura completa do orçamento do mês' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  async getMonthlyBudget(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.budgetsService.getMonthlyBudget(targetMonth);
  }

  @Post('copy-previous')
  @ApiOperation({ summary: 'Copiar estrutura do mês anterior' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês atual no formato YYYY-MM-DD' })
  async copyPrevious(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    await this.budgetsService.copyPreviousMonth(targetMonth);
    return { message: 'Orçamento copiado com sucesso' };
  }

  @Post('groups')
  @ApiOperation({ summary: 'Criar novo grupo de orçamento' })
  createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.budgetsService.createGroup(createGroupDto);
  }

  @Patch('groups/:id')
  @ApiOperation({ summary: 'Atualizar grupo de orçamento' })
  updateGroup(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.budgetsService.updateGroup(+id, updateGroupDto);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Deletar grupo de orçamento' })
  deleteGroup(@Param('id') id: string) {
    return this.budgetsService.deleteGroup(+id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Criar nova categoria' })
  @UsePipes(BusinessValidationPipe)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.budgetsService.createCategory(createCategoryDto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @UsePipes(BusinessValidationPipe)
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.budgetsService.updateCategory(+id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Deletar categoria' })
  @UseGuards(CategoryDeletionGuard)
  deleteCategory(@Param('id') id: string) {
    return this.budgetsService.deleteCategory(+id);
  }

  @Get('categories/:id/available')
  @ApiOperation({ summary: 'Obter valor disponível em uma categoria (alocado - gasto)' })
  getAvailableAmount(@Param('id') id: string) {
    return this.budgetsService.getAvailableAmount(+id);
  }

  @Get('categories/:id/spent')
  @ApiOperation({ summary: 'Obter valor gasto em uma categoria' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  getCategorySpent(@Param('id') id: string, @Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.budgetsService.getCategorySpent(+id, targetMonth);
  }

  @Get('ready-to-assign')
  @ApiOperation({ summary: 'Obter transações da categoria "Pronto para Atribuir"' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês no formato YYYY-MM-DD' })
  getReadyToAssignTransactions(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.budgetsService.getReadyToAssignTransactions(targetMonth);
  }
}