import { IsString } from 'class-validator';

export class CreatePaymentDto {
  /** ID of the invoice to pay */
  @IsString() invoiceId: string;
}
