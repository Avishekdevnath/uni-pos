import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustmentItemDto {
  @ApiProperty()
  @IsUUID()
  product_id!: string;

  @ApiProperty({ description: 'Signed delta: positive=increase, negative=decrease' })
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Per-item idempotency key' })
  @IsOptional()
  @IsUUID()
  client_event_id?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [AdjustmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items!: AdjustmentItemDto[];
}
