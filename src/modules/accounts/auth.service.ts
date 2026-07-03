import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Account } from './entities/account.entity';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccountStatus, UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');
    const account = this.accountRepo.create({ businessName: dto.businessName });
    await this.accountRepo.save(account);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      accountId: account.id,
      email: dto.email,
      passwordHash,
      role: UserRole.OWNER,
    });
    await this.userRepo.save(user);
    return this.generateToken(user, account);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const account = await this.accountRepo.findOne({
      where: { id: user.accountId },
    });
    if (!account) throw new UnauthorizedException('Account not found');
    return this.generateToken(user, account);
  }

  private generateToken(user: User, account: Account) {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        accountId: user.accountId,
        role: user.role,
      }),
      accountId: user.accountId,
      accountStatus: account.status,
    };
  }
}
