import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ListBalancesQueryDto {
  @ApiProperty()
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;
}
