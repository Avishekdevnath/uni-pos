import { IsIn, IsOptional } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';
}
