import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockInItemDto {
  @ApiProperty()
  @IsUUID()
  product_id!: string;

  @ApiProperty({ minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional({ description: 'Per-item idempotency key' })
  @IsOptional()
  @IsUUID()
  client_event_id?: string;
}

export class CreateStockInDto {
  @ApiProperty()
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [StockInItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockInItemDto)
  items!: StockInItemDto[];
}
