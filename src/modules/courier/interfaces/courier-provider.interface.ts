import type { Order } from '../../orders/entities/order.entity';
import type { Customer } from '../../customers/entities/customer.entity';

export interface CourierTrackingStatus {
  status: string;
  estimatedDelivery?: Date;
  lastEvent: string;
  lastEventDate: Date;
}

export interface CreateShipmentResponse {
  trackingNumber: string;
  labelUrl?: string;
}

export interface CourierProvider {
  createShipment(
    order: Order,
    customer: Customer,
  ): Promise<CreateShipmentResponse>;
  trackShipment(trackingNumber: string): Promise<CourierTrackingStatus>;
  cancelShipment(trackingNumber: string): Promise<void>;
  getProviderName(): string;
}

export const COURIER_PROVIDER = 'COURIER_PROVIDER';
