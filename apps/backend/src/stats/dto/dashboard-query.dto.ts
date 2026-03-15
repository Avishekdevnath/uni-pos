import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class DashboardQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  branch_id!: string;

  @ApiPropertyOptional({ enum: ['today', '7d', '30d'], default: 'today' })
  @IsIn(['today', '7d', '30d'])
  period: string = 'today';
}
