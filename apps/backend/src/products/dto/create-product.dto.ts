import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Coca-Cola 500ml',
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'SKU-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @ApiPropertyOptional({
    example: '1234567890123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  barcode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tax_group_id?: string;

  @ApiProperty({
    example: 50,
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 35,
  })
  @IsNumber()
  @Min(0)
  cost!: number;

  @ApiPropertyOptional({
    example: 'pcs',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;
}
