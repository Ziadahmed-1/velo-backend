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
