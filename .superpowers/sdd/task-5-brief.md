### Task 5: Inventory Module — Append-Only Ledger

**Files:**

- Create: `src/modules/inventory/entities/inventory-ledger.entity.ts`
- Create: `src/modules/inventory/dto/adjust-stock.dto.ts`
- Create: `src/modules/inventory/inventory.service.ts`
- Create: `src/modules/inventory/inventory.controller.ts`
- Create: `src/modules/inventory/inventory.module.ts`
- Create: `tests/unit/inventory.service.spec.ts`

- [ ] **Step 1: Copy InventoryLedger entity from reference**

- [ ] **Step 2: Create DTO**

`src/modules/inventory/dto/adjust-stock.dto.ts`:

```typescript
import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { LedgerReason } from '../../../common/enums';
export class AdjustStockDto {
  @IsString() variantId: string;
  @IsInt() quantity: number;
  @IsEnum(LedgerReason) reason: LedgerReason;
  @IsOptional() @IsString() auditNote?: string;
}
```

- [ ] **Step 3: Create InventoryService**

`src/modules/inventory/inventory.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryLedger } from './entities/inventory-ledger.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryLedger)
    private ledgerRepo: Repository<InventoryLedger>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
  ) {}

  async getStock(variantId: string) {
    const { sum } = await this.ledgerRepo
      .createQueryBuilder('ledger')
      .select('SUM(ledger.quantity)', 'sum')
      .where('ledger.variantId = :variantId', { variantId })
      .getRawOne();
    return { variantId, currentStock: parseInt(sum) || 0 };
  }

  async adjust(accountId: string, dto: AdjustStockDto) {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.variantId, accountId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.ledgerRepo.save(
      this.ledgerRepo.create({
        variantId: dto.variantId,
        quantity: dto.quantity,
        reason: dto.reason,
        auditNote: dto.auditNote,
      }),
    );
  }
}
```

- [ ] **Step 4: Create InventoryController**

`src/modules/inventory/inventory.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}
  @Get('variants/:variantId/stock') getStock(
    @Param('variantId') variantId: string,
  ) {
    return this.inventoryService.getStock(variantId);
  }
  @Post('adjust') adjust(
    @CurrentAccount() user: any,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjust(user.accountId, dto);
  }
}
```

- [ ] **Step 5: Create InventoryModule**

`src/modules/inventory/inventory.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryLedger } from './entities/inventory-ledger.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryLedger, ProductVariant])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
```

- [ ] **Step 6: Write inventory tests**

`tests/unit/inventory.service.spec.ts`:

```typescript
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
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '10' }),
      })),
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
    const result = await service.adjust('acc-1', {
      variantId: 'var-1',
      quantity: 10,
      reason: 'INITIAL_RESTOCK' as any,
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
        reason: 'MANUAL_ADJUSTMENT' as any,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npx jest tests/unit/inventory.service.spec.ts --verbose
```

Expected: All 3 tests pass.

- [ ] **Step 8: Build + Commit**

```bash
npx nest build
git add src/modules/inventory/ tests/unit/inventory.service.spec.ts
git commit -m "feat: add inventory ledger module with stock adjustment"
```

---
