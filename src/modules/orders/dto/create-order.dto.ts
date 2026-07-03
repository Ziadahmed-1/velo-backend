import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() variantId: string;
  @IsNumber() quantity: number;
  @IsString() price: string;
}

export class CreateOrderDto {
  @IsString() customerId: string;
  @IsString() subTotal: string;
  @IsString() shippingFee: string;
  @IsString() vatAmount: string;
  @IsString() totalAmount: string;
  @IsOptional() @IsString() courierProvider?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
}
