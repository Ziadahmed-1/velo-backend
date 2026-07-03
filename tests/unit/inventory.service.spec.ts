import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { InventoryLedger } from '../../src/modules/inventory/entities/inventory-ledger.entity';
import { ProductVariant } from '../../src/modules/products/entities/product-variant.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let ledgerRepo: any;
  let variantRepo: any;

  beforeEach(async () => {
    ledgerRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ id: 'entry-1', quantity: 10 }),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '10' }),
      })),
    };
    variantRepo = { findOne: jest.fn().mockResolvedValue({ id: 'var-1', accountId: 'acc-1' }) };
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
    const result = await service.adjust('acc-1', { variantId: 'var-1', quantity: 10, reason: 'INITIAL_RESTOCK' as any });
    expect(ledgerRepo.create).toHaveBeenCalled();
    expect(ledgerRepo.save).toHaveBeenCalled();
  });

  it('should throw if variant not found for the account', async () => {
    variantRepo.findOne.mockResolvedValue(null);
    await expect(service.adjust('other-acc', { variantId: 'var-1', quantity: 5, reason: 'MANUAL_ADJUSTMENT' as any })).rejects.toThrow(NotFoundException);
  });
});
