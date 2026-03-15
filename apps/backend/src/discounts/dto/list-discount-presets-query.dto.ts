import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsIn } from 'class-validator';

export class ListDiscountPresetsQueryDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ example: 'order', enum: ['order', 'line_item'] })
  @IsOptional()
  @IsIn(['order', 'line_item'])
  scope?: 'order' | 'line_item';
}
