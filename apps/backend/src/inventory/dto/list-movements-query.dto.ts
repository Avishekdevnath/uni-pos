import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
}
