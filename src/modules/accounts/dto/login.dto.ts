import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  /** Email address for login */
  @IsEmail()
  email: string;

  /** User's password */
  @IsString()
  password: string;
}
