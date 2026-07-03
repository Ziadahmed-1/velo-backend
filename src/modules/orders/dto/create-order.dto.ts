import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/** A single item line within an order */
class OrderItemDto {
  /** ID of the product variant */
  @IsString() variantId: string;
  /** Quantity ordered */
  @IsNumber() quantity: number;
  /** Unit price as string */
  @IsString() price: string;
}

/** Payload to create a new order atomically */
export class CreateOrderDto {
  /** ID of the customer placing the order */
  @IsString() customerId: string;
  /** Sub-total amount as string */
  @IsString() subTotal: string;
  /** Shipping fee as string */
  @IsString() shippingFee: string;
  /** VAT amount as string */
  @IsString() vatAmount: string;
  /** Total amount as string */
  @IsString() totalAmount: string;
  /** Optional courier provider name */
  @IsOptional() @IsString() courierProvider?: string;
  /** Order line items */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
