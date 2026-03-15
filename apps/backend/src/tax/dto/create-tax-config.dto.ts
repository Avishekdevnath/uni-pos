import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsUUID, IsNumber, Min, Max, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateTaxConfigDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  branch_id!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tax_group_id!: string;

  @ApiProperty({ example: 'CGST' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 9.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_inclusive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
