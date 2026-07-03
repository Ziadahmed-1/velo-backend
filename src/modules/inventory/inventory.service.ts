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

  async getStock(accountId: string, variantId: string) {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId, accountId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
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
