import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RFM_QUEUE } from '../../queues/queue.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Invoice, InventoryLedger]),
    BullModule.registerQueue({ name: RFM_QUEUE }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
