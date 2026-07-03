import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
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
