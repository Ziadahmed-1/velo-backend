import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { Subscription } from './entities/subscription.entity';
import { OverageService } from './overage.service';
import { SubscriptionInvoiceStatus } from '../../common/enums';

/**
 * Generate and manage subscription invoices.
 */
@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(SubscriptionInvoice)
    private invoiceRepo: Repository<SubscriptionInvoice>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    private overageService: OverageService,
  ) {}

  /**
   * Create a new invoice for a subscription.
   * Calculates base + overage amount to determine total.
   * @param subscriptionId - Subscription ID
   * @returns The created SubscriptionInvoice in DRAFT status
   */
  async createInvoice(subscriptionId: string) {
    const subscription = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: { plan: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const { overageAmountEgp } =
      await this.overageService.calculate(subscriptionId);
    const baseAmount = subscription.plan.basePriceEgp;
    const total = (
      parseFloat(baseAmount) + parseFloat(overageAmountEgp)
    ).toFixed(2);

    return this.invoiceRepo.save(
      this.invoiceRepo.create({
        subscriptionId,
        baseAmountEgp: baseAmount,
        overageAmountEgp,
        totalAmountEgp: total,
        status: SubscriptionInvoiceStatus.DRAFT,
      }),
    );
  }

  /**
   * Find all invoices for a subscription ordered by issued date descending.
   * @param subscriptionId - Subscription ID
   * @returns List of invoices
   */
  async findBySubscription(subscriptionId: string) {
    return this.invoiceRepo.find({
      where: { subscriptionId },
      order: { issuedAt: 'DESC' },
    });
  }

  /**
   * Find a single invoice by its ID.
   * @param id - Invoice ID
   * @returns The SubscriptionInvoice entity
   */
  async findOne(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
