import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CourierProvider,
  CreateShipmentResponse,
  CourierTrackingStatus,
} from '../interfaces/courier-provider.interface';
import type { Order } from '../../orders/entities/order.entity';
import type { Customer } from '../../customers/entities/customer.entity';

interface MylerzShipmentData {
  awb?: string;
  trackingNumber?: string;
  labelUrl?: string;
}

interface MylerzTrackingData {
  status: string;
  lastEvent?: string;
  lastEventDate?: string;
}

interface MylerzResponse<T> {
  data: T;
}

@Injectable()
export class MylerzProvider implements CourierProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('MYLERZ_API_KEY')!;
    this.baseUrl = config.get<string>('MYLERZ_BASE_URL')!;
  }

  async createShipment(
    order: Order,
    customer: Customer,
  ): Promise<CreateShipmentResponse> {
    const body = {
      awb: null,
      sender: {},
      receiver: {
        firstName: customer.name.split(' ')[0],
        lastName: customer.name.split(' ').slice(1).join(' '),
        phone: customer.phone,
        address: customer.streetAddress,
        city: customer.governorate,
        district: customer.district,
      },
      cod: parseFloat(order.totalAmount),
      description: `Order ${order.id}`,
    };

    const res = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Mylerz API error: ${res.status} ${await res.text()}`);
    }

    const json =
      (await res.json()) as unknown as MylerzResponse<MylerzShipmentData>;
    return {
      trackingNumber: json.data.awb || json.data.trackingNumber || '',
      labelUrl: json.data.labelUrl,
    };
  }

  async trackShipment(trackingNumber: string): Promise<CourierTrackingStatus> {
    const res = await fetch(`${this.baseUrl}/shipments/${trackingNumber}`, {
      headers: { 'X-API-KEY': this.apiKey },
    });

    if (!res.ok) {
      throw new Error(`Mylerz API error: ${res.status} ${await res.text()}`);
    }

    const json =
      (await res.json()) as unknown as MylerzResponse<MylerzTrackingData>;

    const statusMap: Record<string, string> = {
      CREATED: 'PENDING',
      PICKED_UP: 'SHIPPED',
      IN_TRANSIT: 'SHIPPED',
      DELIVERED: 'DELIVERED',
      RETURNED: 'RETURNED',
      CANCELLED: 'CANCELLED',
    };

    return {
      status: statusMap[json.data.status] || 'PENDING',
      lastEvent: json.data.lastEvent || '',
      lastEventDate: new Date(json.data.lastEventDate || Date.now()),
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/shipments/${trackingNumber}/cancel`,
      {
        method: 'PUT',
        headers: { 'X-API-KEY': this.apiKey },
      },
    );

    if (!res.ok) {
      throw new Error(`Mylerz API error: ${res.status} ${await res.text()}`);
    }
  }

  getProviderName(): string {
    return 'mylerz';
  }
}
