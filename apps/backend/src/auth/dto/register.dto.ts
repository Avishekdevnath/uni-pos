import { IsString, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  business_name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  owner_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  phone?: string;
}
