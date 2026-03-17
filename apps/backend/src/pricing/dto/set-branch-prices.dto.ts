import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceItemDto {
  @IsUUID()
  product_id!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class SetBranchPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceItemDto)
  items!: PriceItemDto[];
}
