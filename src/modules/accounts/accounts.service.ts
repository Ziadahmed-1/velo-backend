import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';

/**
 * Account management: user profile retrieval, profile update, and staff user invitation.
 */
@Injectable()
export class AccountsService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  /**
   * Retrieve the profile of a user within an account.
   * @param accountId - The account the user belongs to
   * @param userId - The user's unique identifier
   * @returns The user profile
   */
  async getProfile(accountId: string, userId: string) {
    return this.userRepo.findOne({ where: { accountId, id: userId } });
  }

  /**
   * Update the profile of a user within an account.
   * @param accountId - The account the user belongs to
   * @param userId - The user's unique identifier
   * @param dto - Partial profile fields to update
   * @returns The updated user profile
   */
  async updateProfile(accountId: string, userId: string, dto: Partial<User>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    await this.userRepo.update({ accountId, id: userId }, dto as any);
    return this.userRepo.findOne({ where: { accountId, id: userId } });
  }

  /**
   * Invite a new staff user to the account.
   * @param accountId - The account to add the user to
   * @param dto - Email and role for the new user
   * @returns The created user
   * @throws ConflictException if a user with that email already exists in the account
   */
  async inviteUser(accountId: string, dto: InviteUserDto) {
    const existing = await this.userRepo.findOne({
      where: { accountId, email: dto.email },
    });
    if (existing)
      throw new ConflictException(
        'User with this email already exists in this account',
      );
    const user = this.userRepo.create({
      accountId,
      email: dto.email,
      passwordHash: 'CHANGE_ME',
      role: dto.role,
    });
    return this.userRepo.save(user);
  }
}
