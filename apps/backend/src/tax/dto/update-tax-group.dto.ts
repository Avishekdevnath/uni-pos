import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional, IsIn } from 'class-validator';

export class UpdateTaxGroupDto {
  @ApiPropertyOptional({ example: 'Standard Rate' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
