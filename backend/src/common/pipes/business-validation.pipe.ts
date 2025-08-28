import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from '../../transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '../../transactions/dto/update-transaction.dto';
import { CreateCategoryDto } from '../../budgets/dto/create-category.dto';
import { UpdateCategoryDto } from '../../budgets/dto/update-category.dto';

@Injectable()
export class BusinessValidationPipe implements PipeTransform {
  transform(value: any, metadata: any) {
    if (!value) return value;

    // Validações para transações
    if (value instanceof CreateTransactionDto || value instanceof UpdateTransactionDto) {
      this.validateTransaction(value);
    }

    // Validações para categorias
    if (value instanceof CreateCategoryDto || value instanceof UpdateCategoryDto) {
      this.validateCategory(value);
    }

    return value;
  }

  private validateTransaction(dto: CreateTransactionDto | UpdateTransactionDto) {
    // Não permitir transações com data futura
    if (dto.date) {
      const transactionDate = new Date(dto.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permitir até o fim do dia atual
      
      if (transactionDate > today) {
        throw new BadRequestException('Não é possível criar transações com data futura');
      }
    }

    // Não permitir valores zero (receitas são valores negativos, despesas são valores positivos)
    if (dto.amount !== undefined && dto.amount === 0) {
      throw new BadRequestException('O valor da transação não pode ser zero');
    }

    // Validar tamanho das anotações
    if (dto.notes && dto.notes.length > 500) {
      throw new BadRequestException('Anotações não podem exceder 500 caracteres');
    }

    // Validar tamanho do nome do pagante
    if (dto.payee && dto.payee.length > 255) {
      throw new BadRequestException('Nome do pagante não pode exceder 255 caracteres');
    }
  }

  private validateCategory(dto: CreateCategoryDto | UpdateCategoryDto) {
    // Não permitir alocação negativa
    if (dto.allocatedAmount !== undefined && dto.allocatedAmount < 0) {
      throw new BadRequestException('Valor alocado não pode ser negativo');
    }

    // Validar nome da categoria
    if (dto.name) {
      if (dto.name.length > 100) {
        throw new BadRequestException('Nome da categoria não pode exceder 100 caracteres');
      }
      
      if (dto.name.trim().length === 0) {
        throw new BadRequestException('Nome da categoria não pode estar vazio');
      }
    }
  }
}