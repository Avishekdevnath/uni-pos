import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateDiscountPresetDto {
  @ApiProperty({ example: 'Summer Sale', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'percentage', enum: ['percentage', 'flat'] })
  @IsIn(['percentage', 'flat'])
  type!: 'percentage' | 'flat';

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiProperty({ example: 'order', enum: ['order', 'line_item'] })
  @IsIn(['order', 'line_item'])
  scope!: 'order' | 'line_item';

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_discount_amount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_combinable?: boolean;
}
