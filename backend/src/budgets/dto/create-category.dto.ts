import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Supermercado' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 500.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedAmount?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  groupId: number;
}