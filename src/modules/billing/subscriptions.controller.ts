import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { InvoicesService } from './invoices.service';
import { PaymobService } from './paymob.service';
import { OverageService } from './overage.service';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('billing')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private invoicesService: InvoicesService,
    private paymobService: PaymobService,
    private overageService: OverageService,
  ) {}

  @Post('subscriptions')
  create(@CurrentAccount() user: RequestUser, @Body('planId') planId?: string) {
    return this.subscriptionsService.create(user.accountId, planId);
  }

  @Get('subscriptions/current')
  getCurrent(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService.getCurrent(user.accountId);
  }

  @Patch('subscriptions/change-plan')
  changePlan(
    @CurrentAccount() user: RequestUser,
    @Body('planId') planId: string,
  ) {
    return this.subscriptionsService.changePlan(user.accountId, planId);
  }

  @Get('invoices')
  getInvoices(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService
      .getCurrent(user.accountId)
      .then((sub) => this.invoicesService.findBySubscription(sub.id));
  }

  @Post('payments/create')
  createPayment(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymobService.createPayment(dto.invoiceId);
  }

  @Public()
  @Post('payments/webhook')
  handlePaymentWebhook(@Body() body: Record<string, any>) {
    return this.paymobService.handleWebhook(body);
  }

  @Post('overage/calculate')
  calculateOverage(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService
      .getCurrent(user.accountId)
      .then((sub) => this.overageService.calculate(sub.id));
  }
}
