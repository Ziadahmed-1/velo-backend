import type { Order } from '../../orders/entities/order.entity';
import type { Customer } from '../../customers/entities/customer.entity';

/** Courier tracking status information */
export interface CourierTrackingStatus {
  /** Current delivery status */
  status: string;
  /** Estimated delivery date, if available */
  estimatedDelivery?: Date;
  /** Description of the last tracking event */
  lastEvent: string;
  /** Date of the last tracking event */
  lastEventDate: Date;
}

/** Response from creating a shipment */
export interface CreateShipmentResponse {
  /** Provider tracking number */
  trackingNumber: string;
  /** URL to download the shipping label, if available */
  labelUrl?: string;
}

/** Courier provider interface — implemented by Bosta and Mylerz */
export interface CourierProvider {
  /**
   * Create a shipment for the given order and customer.
   * @param order - Order to ship
   * @param customer - Customer receiving the shipment
   * @returns Shipment tracking info
   */
  createShipment(
    order: Order,
    customer: Customer,
  ): Promise<CreateShipmentResponse>;
  /**
   * Track a shipment by tracking number.
   * @param trackingNumber - Provider tracking number
   * @returns Current tracking status
   */
  trackShipment(trackingNumber: string): Promise<CourierTrackingStatus>;
  /**
   * Cancel a shipment by tracking number.
   * @param trackingNumber - Provider tracking number
   */
  cancelShipment(trackingNumber: string): Promise<void>;
  /** Get the provider name identifier */
  getProviderName(): string;
}

/** Injection token for courier providers */
export const COURIER_PROVIDER = 'COURIER_PROVIDER';
