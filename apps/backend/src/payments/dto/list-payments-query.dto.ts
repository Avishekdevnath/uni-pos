import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListPaymentsQueryDto {
  @IsUUID()
  branch_id!: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
