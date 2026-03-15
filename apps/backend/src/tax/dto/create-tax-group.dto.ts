import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateTaxGroupDto {
  @ApiProperty({ example: 'Standard Rate' })
  @IsString()
  @MaxLength(100)
  name!: string;
}
