import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddOrderItemDto {
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ValidateIf((o) => !o.product_id)
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  manual_tax_rate?: number;
}
