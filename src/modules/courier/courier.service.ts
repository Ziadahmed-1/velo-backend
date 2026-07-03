import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  CourierProvider,
  COURIER_PROVIDER,
} from './interfaces/courier-provider.interface';
import { OrderStatus } from '../../common/enums';
import type {
  BostaWebhookPayload,
  MylerzWebhookPayload,
} from './dto/courier-webhook.dto';

@Injectable()
export class CourierService {
  private providerMap: Map<string, CourierProvider> = new Map();

  constructor(
    @Inject(COURIER_PROVIDER) providers: CourierProvider[],
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {
    for (const provider of providers) {
      this.providerMap.set(provider.getProviderName(), provider);
    }
  }

  async createShipment(accountId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, accountId },
      relations: { customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const providerName = order.courierProvider?.toLowerCase();
    if (!providerName) {
      throw new NotFoundException('No courier provider assigned to order');
    }

    const provider = this.providerMap.get(providerName);
    if (!provider) {
      throw new NotFoundException(`Unknown courier provider: ${providerName}`);
    }

    const customer = order.customer;
    const result = await provider.createShipment(order, customer);

    order.courierTracking = result.trackingNumber;
    await this.orderRepo.save(order);

    return result;
  }

  async handleWebhook(providerName: string, payload: unknown) {
    let trackingNumber: string | undefined;
    let status: string | undefined;

    if (providerName === 'bosta') {
      const bostaPayload = payload as BostaWebhookPayload;
      trackingNumber = bostaPayload.data?.trackingNumber;
      status = bostaPayload.data?.status;
    } else if (providerName === 'mylerz') {
      const mylerzPayload = payload as MylerzWebhookPayload;
      trackingNumber = mylerzPayload.awb;
      status = mylerzPayload.status;
    } else {
      throw new NotFoundException(`Unknown provider: ${providerName}`);
    }

    if (!trackingNumber) {
      throw new NotFoundException('No tracking number in webhook payload');
    }

    const statusMap: Record<string, OrderStatus> = {
      DELIVERED: OrderStatus.DELIVERED,
      RETURNED: OrderStatus.RETURNED,
      CANCELLED: OrderStatus.CANCELLED,
      SHIPPED: OrderStatus.SHIPPED,
      IN_TRANSIT: OrderStatus.SHIPPED,
      PICKED_UP: OrderStatus.SHIPPED,
    };

    const orderStatus = statusMap[status || ''] || OrderStatus.PENDING;

    const order = await this.orderRepo.findOne({
      where: { courierTracking: trackingNumber },
    });

    if (!order) {
      throw new NotFoundException(
        `Order not found for tracking: ${trackingNumber}`,
      );
    }

    order.status = orderStatus;
    order.courierTracking = trackingNumber;
    await this.orderRepo.save(order);

    return { received: true };
  }
}
