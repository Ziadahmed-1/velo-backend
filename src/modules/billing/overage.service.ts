import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsagePeriod } from './entities/usage-period.entity';
import { Subscription } from './entities/subscription.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class OverageService {
  constructor(
    @InjectRepository(UsagePeriod) private usageRepo: Repository<UsagePeriod>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async calculate(subscriptionId: string) {
    const subscription = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: { plan: true },
    });
    if (!subscription) return { overageOrders: 0, overageAmountEgp: '0' };

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const orderCount = await this.orderRepo.count({
      where: {
        accountId: subscription.accountId,
        isDraft: false,
        createdAt: Between(periodStart, periodEnd),
      },
    });

    const included = subscription.plan.includedOrdersPerPeriod;
    const overageOrders = Math.max(0, orderCount - included);
    const overageAmount = (
      overageOrders * parseFloat(subscription.plan.overagePricePerOrderEgp)
    ).toFixed(2);

    return {
      overageOrders,
      overageAmountEgp: overageAmount,
      orderCount,
      included,
    };
  }

  async recordOverage(subscriptionId: string) {
    const subscription = await this.subRepo.findOne({
      where: { id: subscriptionId },
    });
    if (!subscription) return;

    const { overageOrders, overageAmountEgp } =
      await this.calculate(subscriptionId);

    const existing = await this.usageRepo.findOne({
      where: { subscriptionId, periodStart: subscription.currentPeriodStart },
    });

    if (existing) {
      existing.overageOrders = overageOrders;
      existing.overageAmountEgp = overageAmountEgp;
      await this.usageRepo.save(existing);
    }
  }
}
