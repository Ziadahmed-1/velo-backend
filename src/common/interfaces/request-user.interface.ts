import { UserRole } from '../enums';

export interface RequestUser {
  sub: string;
  accountId: string;
  role: UserRole;
}
