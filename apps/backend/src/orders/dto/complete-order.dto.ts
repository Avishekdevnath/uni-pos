import { IsArray, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentItemDto {
  @IsString()
  @IsIn(['cash'])
  method!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cash_tendered?: number;

  @IsOptional()
  @IsUUID()
  client_event_id?: string;
}

export class CompleteOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  payments!: PaymentItemDto[];
}
