import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event_type?: string;

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
