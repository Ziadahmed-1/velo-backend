import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsString() businessName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
