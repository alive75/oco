import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Supermercado ABC' })
  @IsString()
  @IsNotEmpty()
  payee: string;

  @ApiProperty({ example: 150.75 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ example: 'Compras do mês', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  accountId: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}