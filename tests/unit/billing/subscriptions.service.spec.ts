import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../../../src/modules/billing/subscriptions.service';
import { PlansService } from '../../../src/modules/billing/plans.service';
import { Subscription } from '../../../src/modules/billing/entities/subscription.entity';
import { UsagePeriod } from '../../../src/modules/billing/entities/usage-period.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subRepo: Record<string, jest.Mock>;
  let usageRepo: Record<string, jest.Mock>;
  let plansService: Record<string, jest.Mock>;

  const mockTrialPlan = {
    id: 'plan-trial',
    name: 'Trial',
    basePriceEgp: '0',
    includedOrdersPerPeriod: 50,
    overagePricePerOrderEgp: '5.00',
  };
  const mockSubscription = {
    id: 'sub-1',
    accountId: 'acc-1',
    planId: 'plan-trial',
    status: 'TRIALING',
  };

  beforeEach(async () => {
    subRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(mockSubscription),
    };
    usageRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ id: 'up-1' }),
    };
    plansService = {
      findOne: jest.fn().mockResolvedValue(mockTrialPlan),
      findByName: jest.fn().mockResolvedValue(mockTrialPlan),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        { provide: getRepositoryToken(UsagePeriod), useValue: usageRepo },
        { provide: PlansService, useValue: plansService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should create a trial subscription when no planId given', async () => {
    await service.create('acc-1');
    expect(plansService.findByName).toHaveBeenCalledWith('Trial');
    expect(subRepo.save).toHaveBeenCalled();
    expect(usageRepo.save).toHaveBeenCalled();
  });

  it('should throw if account already has a subscription', async () => {
    subRepo.findOne.mockResolvedValue(mockSubscription);
    await expect(service.create('acc-1')).rejects.toThrow(BadRequestException);
  });

  it('should get current subscription for account', async () => {
    subRepo.findOne.mockResolvedValue(mockSubscription);
    await service.getCurrent('acc-1');
    expect(subRepo.findOne).toHaveBeenCalledWith({
      where: { accountId: 'acc-1' },
      relations: ['plan'],
    });
  });

  it('should throw if no current subscription', async () => {
    await expect(service.getCurrent('no-sub')).rejects.toThrow(
      NotFoundException,
    );
  });
});
