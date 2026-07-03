import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { LedgerReason, OrderSourceChannel } from '../../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async create(accountId: string, dto: CreateOrderDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const order = await qr.manager.save(qr.manager.create(Order, { accountId, customerId: dto.customerId, subTotal: dto.subTotal.toString(), shippingFee: dto.shippingFee.toString(), vatAmount: dto.vatAmount.toString(), totalAmount: dto.totalAmount.toString(), courierProvider: dto.courierProvider || null, sourceChannel: OrderSourceChannel.MANUAL }));
      for (const item of dto.items) {
        await qr.manager.save(qr.manager.create(OrderItem, { orderId: order.id, variantId: item.variantId, quantity: item.quantity, price: item.price.toString() }));
        await qr.manager.save(qr.manager.create(InventoryLedger, { variantId: item.variantId, quantity: -item.quantity, reason: LedgerReason.ORDER_RESERVATION, orderId: order.id }));
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      await qr.manager.save(qr.manager.create(Invoice, { orderId: order.id, invoiceNumber: `INV-${dateStr}-${order.id.substring(0,4).toUpperCase()}` }));
      await qr.commitTransaction();
      return this.orderRepo.findOne({ where: { id: order.id }, relations: { orderItems: true, customer: true, invoice: true } });
    } catch (err) { await qr.rollbackTransaction(); throw err; }
    finally { await qr.release(); }
  }

  async findAll(accountId: string) { return this.orderRepo.find({ where: { accountId }, relations: { orderItems: true, customer: true, invoice: true }, order: { createdAt: 'DESC' } }); }

  async findOne(accountId: string, id: string) {
    const o = await this.orderRepo.findOne({ where: { id, accountId }, relations: { orderItems: true, customer: true, invoice: true } });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }
}
