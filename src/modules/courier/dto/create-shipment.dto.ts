import { IsString } from 'class-validator';

export class CreateShipmentDto {
  /** ID of the order to create a shipment for */
  @IsString()
  orderId: string;
}
