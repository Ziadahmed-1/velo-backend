import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { SubscriptionInvoiceStatus } from '../../common/enums';

/**
 * Payment gateway integration (stubbed — returns mock URLs).
 */
@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  constructor(
    @InjectRepository(SubscriptionInvoice)
    private invoiceRepo: Repository<SubscriptionInvoice>,
  ) {}

  /**
   * Create a mock Paymob payment for an invoice.
   * Marks the invoice as ISSUED and returns a simulated checkout URL.
   * @param invoiceId - Invoice ID to pay
   * @returns Payment URL and invoice ID
   */
  async createPayment(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error('Invoice not found');

    const mockPaymentUrl = `https://accept.paymob.com/mock/checkout?invoice_id=${invoiceId}&amount=${invoice.totalAmountEgp}`;

    await this.invoiceRepo.update(invoiceId, {
      paymentProviderRef: `mock-ref-${Date.now()}`,
      status: SubscriptionInvoiceStatus.ISSUED,
    });

    return { paymentUrl: mockPaymentUrl, invoiceId };
  }

  /**
   * Mock verify a payment by its provider reference.
   * Marks the invoice as PAID.
   * @param paymentRef - Payment provider reference
   * @returns Verification result with mock transaction ID
   */
  async verifyPayment(paymentRef: string) {
    this.logger.log(`Mock verifying payment: ${paymentRef}`);

    const invoice = await this.invoiceRepo.findOne({
      where: { paymentProviderRef: paymentRef },
    });

    if (invoice) {
      await this.invoiceRepo.update(invoice.id, {
        status: SubscriptionInvoiceStatus.PAID,
        paidAt: new Date(),
      });
    }

    return { success: true, transactionId: `mock-txn-${paymentRef}` };
  }

  /**
   * Handle incoming Paymob webhook callbacks.
   * Parses the webhook payload and verifies the associated payment.
   * @param body - Raw webhook payload
   * @returns Success confirmation
   */
  async handleWebhook(body: Record<string, any>) {
    this.logger.debug(
      `Paymob webhook: ${JSON.stringify(body).substring(0, 200)}`,
    );
    const obj = body?.obj as Record<string, any> | undefined;
    const transaction = body?.transaction as Record<string, any> | undefined;
    const transactionId =
      (obj?.id as string | undefined) ||
      (transaction?.id as string | undefined);
    if (obj?.success === true && transactionId) {
      const paymentRef = `mock-ref-${String(obj.order)}`;
      return this.verifyPayment(paymentRef);
    }
    return { success: true };
  }
}
