import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBranchGroupDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
