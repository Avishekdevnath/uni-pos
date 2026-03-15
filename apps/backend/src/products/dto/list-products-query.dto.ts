import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({
    enum: ['active', 'inactive', 'draft'],
  })
  @IsOptional()
  @IsIn(['active', 'inactive', 'draft'])
  status?: string;

  @ApiPropertyOptional({
    example: 'cola',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '1234567890123',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page_size?: number = 20;
}
