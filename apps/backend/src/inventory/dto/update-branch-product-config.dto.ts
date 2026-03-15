import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBranchProductConfigDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  low_stock_threshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
