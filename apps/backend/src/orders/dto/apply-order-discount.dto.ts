import { IsOptional, IsUUID } from 'class-validator';

export class ApplyOrderDiscountDto {
  @IsUUID()
  discount_preset_id!: string;

  @IsOptional()
  @IsUUID()
  order_item_id?: string; // for line_item scope
}
