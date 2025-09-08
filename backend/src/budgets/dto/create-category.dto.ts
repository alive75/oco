import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Supermercado' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100.00, required: false })
  @IsOptional()
  @IsNumber()
  allocatedAmount?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @ApiProperty({ example: 1 })
  @IsNumber()
  groupId: number;
}