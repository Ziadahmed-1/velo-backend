import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { UsagePeriod } from './entities/usage-period.entity';
import { Plan } from './entities/plan.entity';
import { PlansService } from './plans.service';
import { SubscriptionStatus } from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(UsagePeriod) private usageRepo: Repository<UsagePeriod>,
    private plansService: PlansService,
  ) {}

  async create(accountId: string, planId?: string) {
    const existing = await this.subRepo.findOne({ where: { accountId } });
    if (existing)
      throw new BadRequestException('Account already has a subscription');

    let plan: Plan;
    if (planId) {
      plan = await this.plansService.findOne(planId);
    } else {
      const found = await this.plansService.findByName('Trial');
      if (!found)
        throw new NotFoundException('Trial plan not found. Seed plans first.');
      plan = found;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const status =
      plan.name === 'Trial'
        ? SubscriptionStatus.TRIALING
        : SubscriptionStatus.ACTIVE;

    const subscription = await this.subRepo.save(
      this.subRepo.create({
        accountId,
        planId: plan.id,
        status,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }),
    );

    await this.usageRepo.save(
      this.usageRepo.create({
        subscriptionId: subscription.id,
        periodStart: now,
        periodEnd,
      }),
    );

    return this.subRepo.findOne({
      where: { id: subscription.id },
      relations: ['plan'],
    });
  }

  async getCurrent(accountId: string) {
    const sub = await this.subRepo.findOne({
      where: { accountId },
      relations: ['plan'],
    });
    if (!sub) throw new NotFoundException('No active subscription found');
    return sub;
  }

  async changePlan(accountId: string, planId: string) {
    const subscription = await this.subRepo.findOne({ where: { accountId } });
    if (!subscription)
      throw new NotFoundException('No active subscription found');

    const plan = await this.plansService.findOne(planId);

    subscription.planId = plan.id;
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.subRepo.save(subscription);

    return this.subRepo.findOne({
      where: { id: subscription.id },
      relations: ['plan'],
    });
  }
}
