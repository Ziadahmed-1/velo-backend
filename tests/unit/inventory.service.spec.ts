import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { InventoryLedger } from '../../src/modules/inventory/entities/inventory-ledger.entity';
import { ProductVariant } from '../../src/modules/products/entities/product-variant.entity';
import { LedgerReason } from '../../src/common/enums';

describe('InventoryService', () => {
  let service: InventoryService;
  let ledgerRepo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let variantRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum: '10' }),
    };
    ledgerRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ id: 'entry-1', quantity: 10 }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    variantRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'var-1', accountId: 'acc-1' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(InventoryLedger), useValue: ledgerRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });

  it('should return current stock for a variant', async () => {
    const result = await service.getStock('var-1');
    expect(result.currentStock).toBe(10);
  });

  it('should add a ledger entry on stock adjust', async () => {
    await service.adjust('acc-1', {
      variantId: 'var-1',
      quantity: 10,
      reason: LedgerReason.INITIAL_RESTOCK,
    });
    expect(ledgerRepo.create).toHaveBeenCalled();
    expect(ledgerRepo.save).toHaveBeenCalled();
  });

  it('should throw if variant not found for the account', async () => {
    variantRepo.findOne.mockResolvedValue(null);
    await expect(
      service.adjust('other-acc', {
        variantId: 'var-1',
        quantity: 5,
        reason: LedgerReason.MANUAL_ADJUSTMENT,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
