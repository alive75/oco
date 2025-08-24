import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsDateString, Min, Max, MaxLength, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { NotFutureDateConstraint } from '../../common/validators/not-future-date.validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '2024-01-15', description: 'Data da transação (não pode ser no futuro)' })
  @IsDateString()
  @Validate(NotFutureDateConstraint)
  date: string;

  @ApiProperty({ example: 'Supermercado ABC', description: 'Beneficiário da transação' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'O nome do pagante não pode ter mais de 200 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  payee: string;

  @ApiProperty({ example: 150.75, description: 'Valor da transação (deve ser positivo e não pode exceder R$ 1,000,000)' })
  @IsNumber({}, { message: 'O valor deve ser um número válido' })
  @Min(0.01, { message: 'O valor deve ser maior que zero' })
  @Max(1000000, { message: 'O valor não pode exceder R$ 1.000.000' })
  amount: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ example: 'Compras do mês', required: false, description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'As anotações não podem ter mais de 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  notes?: string;

  @ApiProperty({ example: 1, description: 'ID da conta onde a transação será registrada' })
  @IsNumber({}, { message: 'ID da conta deve ser um número válido' })
  @Min(1, { message: 'ID da conta deve ser maior que zero' })
  accountId: number;

  @ApiProperty({ example: 1, required: false, description: 'ID da categoria de orçamento (opcional)' })
  @IsOptional()
  @IsNumber({}, { message: 'ID da categoria deve ser um número válido' })
  @Min(1, { message: 'ID da categoria deve ser maior que zero' })
  categoryId?: number;
}