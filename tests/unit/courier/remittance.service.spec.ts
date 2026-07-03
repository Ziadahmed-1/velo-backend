import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RemittanceService } from '../../../src/modules/courier/remittance.service';
import { CourierRemittance } from '../../../src/modules/courier/entities/courier-remittance.entity';
import { CourierRemittanceLine } from '../../../src/modules/courier/entities/courier-remittance-line.entity';
import { RemittanceStatus } from '../../../src/common/enums';

describe('RemittanceService', () => {
  let service: RemittanceService;
  let remittanceRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let lineRepo: { update: jest.Mock };

  const mockRemittance = {
    id: 'rem-1',
    accountId: 'acc-1',
    courierProvider: 'bosta',
    expectedAmount: '200',
    receivedAmount: '0',
    status: RemittanceStatus.PENDING,
    lines: [
      {
        id: 'line-1',
        expectedAmount: '100',
        receivedAmount: '100',
        orderId: 'ord-1',
      },
      {
        id: 'line-2',
        expectedAmount: '100',
        receivedAmount: '100',
        orderId: 'ord-2',
      },
    ],
  };

  beforeEach(async () => {
    remittanceRepo = {
      find: jest.fn().mockResolvedValue([mockRemittance]),
      findOne: jest.fn().mockResolvedValue(mockRemittance),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    lineRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemittanceService,
        {
          provide: getRepositoryToken(CourierRemittance),
          useValue: remittanceRepo,
        },
        {
          provide: getRepositoryToken(CourierRemittanceLine),
          useValue: lineRepo,
        },
      ],
    }).compile();
    service = module.get<RemittanceService>(RemittanceService);
  });

  it('should list all remittances for an account', async () => {
    const result = await service.findAll('acc-1');
    expect(result).toHaveLength(1);
    expect(remittanceRepo.find).toHaveBeenCalledWith({
      where: { accountId: 'acc-1' },
    });
  });

  it('should find a remittance with lines', async () => {
    const result = await service.findOne('acc-1', 'rem-1');
    expect(result.id).toBe('rem-1');
    expect(remittanceRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'rem-1', accountId: 'acc-1' },
      relations: { lines: true },
    });
  });

  it('should throw when remittance not found', async () => {
    remittanceRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('acc-1', 'bad-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should reconcile all lines and mark as SETTLED', async () => {
    remittanceRepo.findOne
      .mockResolvedValueOnce(mockRemittance)
      .mockResolvedValueOnce({
        ...mockRemittance,
        status: RemittanceStatus.SETTLED,
      });

    const result = await service.reconcile('acc-1', 'rem-1');
    expect(remittanceRepo.update).toHaveBeenCalledWith('rem-1', {
      status: RemittanceStatus.SETTLED,
      receivedAmount: mockRemittance.expectedAmount,
    });
    expect(result.status).toBe(RemittanceStatus.SETTLED);
  });

  it('should mark as PARTIAL when amounts mismatch', async () => {
    remittanceRepo.findOne
      .mockResolvedValueOnce({
        ...mockRemittance,
        lines: [
          {
            id: 'line-1',
            expectedAmount: '100',
            receivedAmount: '50',
            orderId: 'ord-1',
          },
          {
            id: 'line-2',
            expectedAmount: '100',
            receivedAmount: '100',
            orderId: 'ord-2',
          },
        ],
      })
      .mockResolvedValueOnce({
        ...mockRemittance,
        status: RemittanceStatus.PARTIAL,
      });

    await service.reconcile('acc-1', 'rem-1');
    expect(remittanceRepo.update).toHaveBeenCalledWith('rem-1', {
      status: RemittanceStatus.PARTIAL,
    });
  });
});
