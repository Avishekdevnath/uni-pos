import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Beverages',
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
