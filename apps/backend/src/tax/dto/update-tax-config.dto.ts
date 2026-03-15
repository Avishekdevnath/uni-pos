import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsNumber, Min, Max, IsBoolean, IsOptional, IsInt, IsIn } from 'class-validator';

export class UpdateTaxConfigDto {
  @ApiPropertyOptional({ example: 'CGST' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 9.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_inclusive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
