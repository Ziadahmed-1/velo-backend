import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/accounts/auth.service';
import { Account } from '../../src/modules/accounts/entities/account.entity';
import { User } from '../../src/modules/accounts/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let accountRepo: any;
  let userRepo: any;

  const mockAccount = { id: 'acc-1', businessName: 'Test', status: 'TRIALING' };
  const mockUser = {
    id: 'usr-1',
    accountId: 'acc-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: 'OWNER',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token-123') },
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should register a new account with owner user', async () => {
    userRepo.findOne.mockResolvedValue(null);
    const result = await service.register({
      businessName: 'Test',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBe('token-123');
  });

  it('should throw ConflictException on duplicate email', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    await expect(
      service.register({
        businessName: 'Test',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should login with valid credentials', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.accessToken).toBe('token-123');
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
