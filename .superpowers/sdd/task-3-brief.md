### Task 3: Accounts Module — Entities + Auth

**Files:**
- Create: `src/modules/accounts/entities/account.entity.ts`
- Create: `src/modules/accounts/entities/user.entity.ts`
- Create: `src/modules/accounts/dto/register.dto.ts`
- Create: `src/modules/accounts/dto/login.dto.ts`
- Create: `src/modules/accounts/dto/invite-user.dto.ts`
- Create: `src/modules/accounts/auth.service.ts`
- Create: `src/modules/accounts/auth.controller.ts`
- Create: `src/modules/accounts/accounts.service.ts`
- Create: `src/modules/accounts/accounts.controller.ts`
- Create: `src/modules/accounts/accounts.module.ts`
- Create: `src/modules/accounts/jwt.strategy.ts`
- Create: `tests/unit/auth.service.spec.ts`

- [ ] **Step 1-2: Copy Account + User entities from reference**

- [ ] **Step 3: Create DTOs**

`src/modules/accounts/dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsString() businessName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
```

`src/modules/accounts/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
```

`src/modules/accounts/dto/invite-user.dto.ts`:
```typescript
import { IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums';
export class InviteUserDto {
  @IsEmail() email: string;
  @IsEnum(UserRole) role: UserRole;
}
```

- [ ] **Step 4: Create JWT strategy**

`src/modules/accounts/jwt.strategy.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }
  async validate(payload: { sub: string; accountId: string; role: string }) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    const account = await this.accountRepo.findOne({ where: { id: payload.accountId } });
    return { id: user.id, accountId: user.accountId, role: user.role, accountStatus: account?.status };
  }
}
```

- [ ] **Step 5: Create AuthService**

`src/modules/accounts/auth.service.ts`:
```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const account = this.accountRepo.create({ businessName: dto.businessName });
    await this.accountRepo.save(account);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({ accountId: account.id, email: dto.email, passwordHash, role: UserRole.OWNER });
    await this.userRepo.save(user);
    return this.generateToken(user, account);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const account = await this.accountRepo.findOne({ where: { id: user.accountId } });
    return this.generateToken(user, account);
  }

  private generateToken(user: User, account: Account) {
    return {
      accessToken: this.jwtService.sign({ sub: user.id, accountId: user.accountId, role: user.role }),
      accountId: user.accountId,
      accountStatus: account.status,
    };
  }
}
```

- [ ] **Step 6: Create AuthController**

`src/modules/accounts/auth.controller.ts`:
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.authService.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.authService.login(dto); }
}
```

- [ ] **Step 7: Create AccountsService + Controller**

`src/modules/accounts/accounts.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}
  async inviteUser(accountId: string, dto: InviteUserDto) {
    const user = this.userRepo.create({ accountId, email: dto.email, passwordHash: 'CHANGE_ME', role: dto.role });
    return this.userRepo.save(user);
  }
}
```

`src/modules/accounts/accounts.controller.ts`:
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { UserRole } from '../../common/enums';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}
  @Post('invite')
  @Roles(UserRole.OWNER)
  invite(@CurrentAccount() user: any, @Body() dto: InviteUserDto) {
    return this.accountsService.inviteUser(user.accountId, dto);
  }
}
```

- [ ] **Step 8: Create AccountsModule**

`src/modules/accounts/accounts.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Account } from './entities/account.entity';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
  ],
  controllers: [AuthController, AccountsController],
  providers: [AuthService, AccountsService, JwtStrategy],
})
export class AccountsModule {}
```

- [ ] **Step 9: Write auth tests**

`tests/unit/auth.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/accounts/auth.service';
import { Account } from '../../src/modules/accounts/entities/account.entity';
import { User } from '../../src/modules/accounts/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let accountRepo: any;
  let userRepo: any;

  const mockAccount = { id: 'acc-1', businessName: 'Test', status: 'TRIALING' };
  const mockUser = { id: 'usr-1', accountId: 'acc-1', email: 'test@example.com', passwordHash: 'hashed', role: 'OWNER' };

  beforeEach(async () => {
    accountRepo = {
      create: jest.fn().mockReturnValue(mockAccount),
      save: jest.fn().mockResolvedValue(mockAccount),
      findOne: jest.fn().mockResolvedValue(mockAccount),
    };
    userRepo = {
      create: jest.fn().mockReturnValue(mockUser),
      save: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token-123') } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should register a new account with owner user', async () => {
    userRepo.findOne.mockResolvedValue(null);
    const result = await service.register({ businessName: 'Test', email: 'test@example.com', password: 'password123' });
    expect(result.accessToken).toBe('token-123');
  });

  it('should throw ConflictException on duplicate email', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    await expect(service.register({ businessName: 'Test', email: 'test@example.com', password: 'password123' })).rejects.toThrow(ConflictException);
  });

  it('should login with valid credentials', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    const result = await service.login({ email: 'test@example.com', password: 'password123' });
    expect(result.accessToken).toBe('token-123');
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 10: Run tests**

```bash
npx jest tests/unit/auth.service.spec.ts --verbose
```

Expected: All 4 tests pass.

- [ ] **Step 11: Build + Commit**

```bash
npx nest build
git add src/modules/accounts/ src/common/ tests/unit/auth.service.spec.ts
git commit -m "feat: add auth module with JWT authentication and guards"
```

---


