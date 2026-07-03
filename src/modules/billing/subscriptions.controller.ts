import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { InvoicesService } from './invoices.service';
import { PaymobService } from './paymob.service';
import { OverageService } from './overage.service';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiBearerAuth()
@ApiTags('Billing')
@Controller('billing')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private invoicesService: InvoicesService,
    private paymobService: PaymobService,
    private overageService: OverageService,
  ) {}

  @ApiOperation({
    summary: 'Create subscription',
    description:
      'Creates a new subscription for the current account. If no planId is provided, creates a trial subscription.',
  })
  @ApiResponse({ status: 201, description: 'Subscription created.' })
  @ApiResponse({
    status: 400,
    description: 'Account already has a subscription.',
  })
  @Post('subscriptions')
  create(@CurrentAccount() user: RequestUser, @Body('planId') planId?: string) {
    return this.subscriptionsService.create(user.accountId, planId);
  }

  @ApiOperation({
    summary: 'Get current subscription',
    description:
      'Returns the current active subscription with plan details for the authenticated account.',
  })
  @ApiResponse({ status: 200, description: 'Current subscription returned.' })
  @ApiResponse({ status: 404, description: 'No active subscription found.' })
  @Get('subscriptions/current')
  getCurrent(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService.getCurrent(user.accountId);
  }

  @ApiOperation({
    summary: 'Change subscription plan',
    description:
      'Upgrades or downgrades the current subscription to a different plan.',
  })
  @ApiResponse({ status: 200, description: 'Plan changed successfully.' })
  @ApiResponse({ status: 404, description: 'Subscription or plan not found.' })
  @Patch('subscriptions/change-plan')
  changePlan(
    @CurrentAccount() user: RequestUser,
    @Body('planId') planId: string,
  ) {
    return this.subscriptionsService.changePlan(user.accountId, planId);
  }

  @ApiOperation({
    summary: 'List invoices',
    description: 'Returns all invoices for the current subscription.',
  })
  @ApiResponse({ status: 200, description: 'Invoices list returned.' })
  @Get('invoices')
  getInvoices(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService
      .getCurrent(user.accountId)
      .then((sub) => this.invoicesService.findBySubscription(sub.id));
  }

  @ApiOperation({
    summary: 'Create payment',
    description:
      'Creates a payment for a given invoice via Paymob (mocked). Returns a checkout URL.',
  })
  @ApiResponse({ status: 201, description: 'Payment URL created.' })
  @Post('payments/create')
  createPayment(
    @CurrentAccount() user: RequestUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymobService.createPayment(dto.invoiceId);
  }

  @ApiOperation({
    summary: 'Paymob webhook',
    description:
      'Handles incoming Paymob payment webhook callbacks. Public endpoint.',
  })
  @ApiResponse({ status: 201, description: 'Webhook processed.' })
  @Public()
  @Post('payments/webhook')
  handlePaymentWebhook(@Body() body: Record<string, any>) {
    return this.paymobService.handleWebhook(body);
  }

  @ApiOperation({
    summary: 'Calculate overage',
    description:
      'Calculates overage fees for the current billing period based on order count exceeding plan limit.',
  })
  @ApiResponse({ status: 200, description: 'Overage calculation returned.' })
  @Post('overage/calculate')
  calculateOverage(@CurrentAccount() user: RequestUser) {
    return this.subscriptionsService
      .getCurrent(user.accountId)
      .then((sub) => this.overageService.calculate(sub.id));
  }
}
