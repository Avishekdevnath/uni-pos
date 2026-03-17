import { IsString, MinLength } from 'class-validator';

export class ImpersonateDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
