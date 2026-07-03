import { IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums';
export class InviteUserDto {
  @IsEmail() email: string;
  @IsEnum(UserRole) role: UserRole;
}
