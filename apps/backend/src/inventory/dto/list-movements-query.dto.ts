import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListMovementsQueryDto {
  @ApiProperty()
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  movement_type?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date string (inclusive lower bound)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date string (inclusive upper bound)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  page_size: number = 20;
}
