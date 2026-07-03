import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Invoice } from './entities/invoice.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { InventoryLedger } from '../inventory/entities/inventory-ledger.entity';
import { LedgerReason, OrderSourceChannel } from '../../common/enums';
import { RFM_QUEUE } from '../../queues/queue.constants';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private dataSource: DataSource,
    @InjectQueue(RFM_QUEUE) private rfmQueue: Queue,
  ) {}

  /**
   * Create an order atomically with items and stock reservation.
   * Uses a database transaction to ensure consistency.
   * @param accountId - Tenant account ID
   * @param dto - Order creation payload
   * @returns The created Order entity with items, customer, and invoice
   */
  async create(accountId: string, dto: CreateOrderDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const order = await qr.manager.save(
        qr.manager.create(Order, {
          accountId,
          customerId: dto.customerId,
          subTotal: dto.subTotal.toString(),
          shippingFee: dto.shippingFee.toString(),
          vatAmount: dto.vatAmount.toString(),
          totalAmount: dto.totalAmount.toString(),
          courierProvider: dto.courierProvider || null,
          sourceChannel: OrderSourceChannel.MANUAL,
        }),
      );
      for (const item of dto.items) {
        await qr.manager.save(
          qr.manager.create(OrderItem, {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price.toString(),
          }),
        );
        await qr.manager.save(
          qr.manager.create(InventoryLedger, {
            variantId: item.variantId,
            quantity: -item.quantity,
            reason: LedgerReason.ORDER_RESERVATION,
            orderId: order.id,
          }),
        );
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      await qr.manager.save(
        qr.manager.create(Invoice, {
          orderId: order.id,
          invoiceNumber: `INV-${dateStr}-${order.id.substring(0, 4).toUpperCase()}`,
        }),
      );
      await qr.commitTransaction();
      return this.orderRepo.findOne({
        where: { id: order.id },
        relations: { orderItems: true, customer: true, invoice: true },
      });
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  /**
   * List all orders with items, customer, and invoice.
   * @param accountId - Tenant account ID
   * @returns Array of Order entities
   */
  async findAll(accountId: string) {
    return this.orderRepo.find({
      where: { accountId },
      relations: { orderItems: true, customer: true, invoice: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single order by ID.
   * @param accountId - Tenant account ID
   * @param id - Order ID
   * @returns The Order entity with items, customer, and invoice
   * @throws NotFoundException if not found
   */
  async findOne(accountId: string, id: string) {
    const o = await this.orderRepo.findOne({
      where: { id, accountId },
      relations: { orderItems: true, customer: true, invoice: true },
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  /**
   * Confirm a draft order, marking it as non-draft and enqueuing an RFM job.
   * @param accountId - Tenant account ID
   * @param id - Order ID
   * @param dto - Optional confirmation payload (e.g. courier override)
   * @returns The updated Order entity
   * @throws NotFoundException if order not found
   * @throws BadRequestException if order is already confirmed
   */
  async confirmOrder(accountId: string, id: string, dto?: ConfirmOrderDto) {
    const order = await this.findOne(accountId, id);
    if (!order.isDraft)
      throw new BadRequestException('Order already confirmed');

    order.isDraft = false;
    if (dto?.courierProvider) order.courierProvider = dto.courierProvider;
    await this.orderRepo.save(order);

    await this.rfmQueue.add('rfm', { orderId: order.id, accountId });

    return this.findOne(accountId, id);
  }
}
