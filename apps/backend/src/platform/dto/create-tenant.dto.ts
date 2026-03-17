import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(1)
  business_name!: string;

  @IsString()
  @MinLength(1)
  owner_name!: string;

  @IsEmail()
  owner_email!: string;

  @IsOptional()
  @IsString()
  owner_phone?: string;
}
