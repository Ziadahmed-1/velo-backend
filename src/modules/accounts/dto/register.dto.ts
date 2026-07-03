import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /** Business name for the new account */
  @IsString()
  businessName: string;

  /** Email address for login and account correspondence */
  @IsEmail()
  email: string;

  /** Password (minimum 8 characters) */
  @IsString()
  @MinLength(8)
  password: string;
}
