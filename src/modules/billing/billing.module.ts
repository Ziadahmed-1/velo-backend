import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { UsagePeriod } from './entities/usage-period.entity';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Subscription, UsagePeriod, SubscriptionInvoice])],
})
export class BillingModule {}
