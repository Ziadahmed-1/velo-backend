import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PlansService } from '../../../src/modules/billing/plans.service';
import { Plan } from '../../../src/modules/billing/entities/plan.entity';

describe('PlansService', () => {
  let service: PlansService;
  let repo: Record<string, jest.Mock>;

  const mockPlan = {
    id: 'plan-1',
    name: 'Starter',
    basePriceEgp: '999',
    includedOrdersPerPeriod: 250,
    overagePricePerOrderEgp: '4.00',
    billingInterval: 'MONTHLY' as const,
    features: [],
    isActive: true,
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(mockPlan),
      find: jest.fn().mockResolvedValue([mockPlan]),
      findOne: jest.fn().mockResolvedValue(mockPlan),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: getRepositoryToken(Plan), useValue: repo },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  it('should create a plan', async () => {
    const result = await service.create({
      name: 'Starter',
      basePriceEgp: 999,
      includedOrdersPerPeriod: 250,
      overagePricePerOrderEgp: 4,
    });
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result.name).toBe('Starter');
  });

  it('should find all active plans', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      }),
    );
  });

  it('should find a plan by id', async () => {
    const result = await service.findOne('plan-1');
    expect(result.id).toBe('plan-1');
  });

  it('should throw if plan not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
  });
});
