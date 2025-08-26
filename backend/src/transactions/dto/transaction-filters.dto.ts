import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionFiltersDto {
  @ApiProperty({ required: false, description: 'ID da conta' })
  @IsOptional()
  accountId?: string;

  @ApiProperty({ required: false, description: 'ID da categoria' })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Transação compartilhada' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ required: false, description: 'ID do usuário' })
  @IsOptional()
  userId?: string;
}