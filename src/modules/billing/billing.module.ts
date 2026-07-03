import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { UsagePeriod } from './entities/usage-period.entity';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { Order } from '../orders/entities/order.entity';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { InvoicesService } from './invoices.service';
import { PaymobService } from './paymob.service';
import { OverageService } from './overage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      UsagePeriod,
      SubscriptionInvoice,
      Order,
    ]),
  ],
  controllers: [PlansController, SubscriptionsController],
  providers: [
    PlansService,
    SubscriptionsService,
    InvoicesService,
    PaymobService,
    OverageService,
  ],
})
export class BillingModule {}
