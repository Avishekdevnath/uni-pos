import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddOrderItemDto {
  @IsUUID()
  product_id!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;
}
