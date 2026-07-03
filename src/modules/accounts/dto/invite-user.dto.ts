import { IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class InviteUserDto {
  /** Email address of the user to invite */
  @IsEmail()
  email: string;

  /** Role to assign to the invited user */
  @IsEnum(UserRole)
  role: UserRole;
}
