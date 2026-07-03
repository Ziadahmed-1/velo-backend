import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString() variantId: string;
  @IsNumber() quantity: number;
  @IsNumber() price: number;
}

export class CreateOrderDto {
  @IsString() customerId: string;
  @IsNumber() subTotal: number;
  @IsNumber() shippingFee: number;
  @IsNumber() vatAmount: number;
  @IsNumber() totalAmount: number;
  @IsOptional() @IsString() courierProvider?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
}
