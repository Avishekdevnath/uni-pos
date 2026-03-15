import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListBalancesQueryDto {
  @ApiProperty()
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Filter items below low stock threshold' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  low_stock?: boolean;

  @ApiPropertyOptional({ description: 'Search by product name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  page_size: number = 20;
}
