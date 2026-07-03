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
import { UserRole } from '../../common/enums';

/**
 * Authentication: account registration and email/password login with JWT token issuance.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new account with an owner user.
   * Creates both an Account and a User record, hashes the password, and returns a JWT.
   * @param dto - Registration credentials (businessName, email, password)
   * @returns An object containing the access token, account ID, and account status
   * @throws ConflictException if the email is already registered
   */
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

  /**
   * Authenticate a user with email and password.
   * Validates credentials, fetches the associated account, and returns a JWT.
   * @param dto - Login credentials (email, password)
   * @returns An object containing the access token, account ID, and account status
   * @throws UnauthorizedException if credentials are invalid or account is not found
   */
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

  /**
   * Generate a JWT access token for the authenticated user.
   * @param user - The authenticated user entity
   * @param account - The user's associated account
   * @returns An object with the access token, account ID, and account status
   */
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
