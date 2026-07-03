import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Invoice, InventoryLedger])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
