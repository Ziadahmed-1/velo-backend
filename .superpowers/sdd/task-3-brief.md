# Task 3: Courier Module — Bosta/Mylerz Providers, Webhooks, Remittance

## Files
- Create: `src/modules/courier/interfaces/courier-provider.interface.ts`
- Create: `src/modules/courier/providers/bosta.provider.ts`
- Create: `src/modules/courier/providers/mylerz.provider.ts`
- Create: `src/modules/courier/courier.service.ts`
- Create: `src/modules/courier/remittance.service.ts`
- Create: `src/modules/courier/courier.controller.ts`
- Create: `src/modules/courier/dto/create-shipment.dto.ts`
- Create: `src/modules/courier/dto/courier-webhook.dto.ts`
- Modify: `src/modules/courier/courier.module.ts`

## CourierProvider interface

**src/modules/courier/interfaces/courier-provider.interface.ts:**
```typescript
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
  createShipment(order: Order, customer: Customer): Promise<CreateShipmentResponse>;
  trackShipment(trackingNumber: string): Promise<CourierTrackingStatus>;
  cancelShipment(trackingNumber: string): Promise<void>;
  getProviderName(): string;
}

export const COURIER_PROVIDER = 'COURIER_PROVIDER';
```

## BostaProvider

**src/modules/courier/providers/bosta.provider.ts:**
- Injects ConfigService for `BOSTA_API_KEY` and `BOSTA_BASE_URL`
- Implements CourierProvider
- `createShipment`: POST to `${baseUrl}/shipments` with Bosta's API format:
  ```javascript
  { type: 10 (last mile), spec: { address: customer.street, city: customer.governorate, district: customer.district }, notes: `Order ${order.id}`, receiver: { firstName: customer.name.split(' ')[0], lastName: customer.name.split(' ').slice(1).join(' '), phone: customer.phone }, cod: parseFloat(order.totalAmount) }
  ```
  Headers: `{ 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }`
  Response mapping: extract `trackingNumber` and `labelUrl` from Bosta response
- `trackShipment`: GET `${baseUrl}/shipments/${trackingNumber}`
  Map Bosta statuses: 'PENDING' → 'PENDING', 'IN_TRANSIT' → 'SHIPPED', 'DELIVERED' → 'DELIVERED', 'RETURNED' → 'RETURNED'
- `cancelShipment`: PUT `${baseUrl}/shipments/${trackingNumber}/cancel`
- `getProviderName`: return `'bosta'`

## MylerzProvider

**src/modules/courier/providers/mylerz.provider.ts:**
- Same pattern as BostaProvider
- Injects `MYLERZ_API_KEY` and `MYLERZ_BASE_URL`
- Different API format for Mylerz
- `createShipment`: POST with Mylerz's payload format
- `trackShipment`, `cancelShipment`
- `getProviderName`: return `'mylerz'`

## CourierService

**src/modules/courier/courier.service.ts:**
- Holds a Map of provider name → CourierProvider, populated by injecting `@Inject(COURIER_PROVIDER) private providers: CourierProvider[]`
- `createShipment(accountId: string, orderId: string)`:
  1. Load Order + Customer by IDs (scoped to accountId)
  2. Resolve provider from `order.courierProvider` (lowercased)
  3. Call provider.createShipment(order, customer)
  4. Save trackingNumber on Order
  5. Return tracking info
- `handleWebhook(providerName: string, payload: any)`:
  1. Parse courier-specific payload
  2. Map status to OrderStatus
  3. Update Order.status and courierTracking

## RemittanceService

**src/modules/courier/remittance.service.ts:**
- Injects `Repository<CourierRemittance>` and `Repository<CourierRemittanceLine>`
- `findAll(accountId)`: List all remittances for account
- `findOne(accountId, id)`: Get remittance with lines
- `reconcile(accountId, id)`: For each line, compare `order.totalAmount` to remitted amount, update status to SETTLED if matched

## CourierController

**src/modules/courier/courier.controller.ts:**
```typescript
@Controller('courier')
export class CourierController {
  constructor(
    private courierService: CourierService,
    private remittanceService: RemittanceService,
  ) {}

  @Post('shipments')
  createShipment(@CurrentAccount() user: RequestUser, @Body() dto: CreateShipmentDto) {
    return this.courierService.createShipment(user.accountId, dto.orderId);
  }

  @Post('webhooks/bosta')
  @Public()  // skip auth
  handleBostaWebhook(@Body() payload: any) {
    return this.courierService.handleWebhook('bosta', payload);
  }

  @Post('webhooks/mylerz')
  @Public()  // skip auth
  handleMylerzWebhook(@Body() payload: any) {
    return this.courierService.handleWebhook('mylerz', payload);
  }

  @Get('remittances')
  getRemittances(@CurrentAccount() user: RequestUser) {
    return this.remittanceService.findAll(user.accountId);
  }

  @Get('remittances/:id')
  getRemittance(@CurrentAccount() user: RequestUser, @Param('id') id: string) {
    return this.remittanceService.findOne(user.accountId, id);
  }
}
```

**Note on @Public()**: NestJS doesn't have a built-in @Public() decorator. Create one at `src/common/decorators/public.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Then update `AuthGuard` in `src/common/guards/auth.guard.ts` to skip when `IS_PUBLIC_KEY` is set:
```typescript
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
// In handleRequest or canActivate — check reflector
```

Actually, the simpler approach: The webhooks don't use any auth. Just have them be plain routes without JWT. Since the global AuthGuard applies, you need to add the `@Public()` decorator approach (more idiomatic) or use `@SkipAuth()` — let me clarify.

Use the standard NestJS approach:
1. Create `src/common/decorators/public.decorator.ts`
2. Modify `AuthGuard` to check `this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])` and return true if set.
3. Add `Reflector` injection to AuthGuard constructor.

## CourierModule

**src/modules/courier/courier.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { RemittanceService } from './remittance.service';
import { BostaProvider } from './providers/bosta.provider';
import { MylerzProvider } from './providers/mylerz.provider';
import { COURIER_PROVIDER } from './interfaces/courier-provider.interface';
import { CourierRemittance } from './entities/courier-remittance.entity';
import { CourierRemittanceLine } from './entities/courier-remittance-line.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourierRemittance, CourierRemittanceLine, Order, Customer]),
  ],
  controllers: [CourierController],
  providers: [
    CourierService,
    RemittanceService,
    BostaProvider,
    MylerzProvider,
    {
      provide: COURIER_PROVIDER,
      useFactory: (bosta: BostaProvider, mylerz: MylerzProvider) => [bosta, mylerz],
      inject: [BostaProvider, MylerzProvider],
    },
  ],
})
export class CourierModule {}
```

## DTOs

**src/modules/courier/dto/create-shipment.dto.ts:**
```typescript
import { IsString } from 'class-validator';
export class CreateShipmentDto {
  @IsString() orderId: string;
}
```

**src/modules/courier/dto/courier-webhook.dto.ts:**
```typescript
export class BostaWebhookPayload {
  type: string;
  data: {
    _id: string;
    trackingNumber: string;
    status: string;
    [key: string]: any;
  };
}

export class MylerzWebhookPayload {
  awb: string;
  status: string;
  [key: string]: any;
}
```

## Tests

Create `tests/unit/courier/bosta.provider.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BostaProvider } from '../../src/modules/courier/providers/bosta.provider';

describe('BostaProvider', () => {
  let provider: BostaProvider;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BostaProvider,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();
    provider = module.get<BostaProvider>(BostaProvider);
  });

  it('should create shipment and return tracking number', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { trackingNumber: 'BOSTA-123', labelUrl: 'https://bosta.com/label' } }),
    });
    (global as any).fetch = mockFetch;

    const order = { id: 'ord-1', totalAmount: '100', courierProvider: 'bosta' } as any;
    const customer = { name: 'Test User', phone: '01000000000', governorate: 'Cairo', district: 'Nasr City', street: 'Main St' } as any;
    const result = await provider.createShipment(order, customer);
    expect(result.trackingNumber).toBe('BOSTA-123');
  });

  it('should map Bosta status to internal status', async () => {});
  it('should throw on API error', async () => {});
});
```

Create `tests/unit/courier/remittance.service.spec.ts`.

## Env additions
```
BOSTA_API_KEY=
BOSTA_BASE_URL=https://api.bosta.com/v2
MYLERZ_API_KEY=
MYLERZ_BASE_URL=https://api.mylerz.com
```

## Commit
```bash
git add src/modules/courier/ src/common/decorators/public.decorator.ts
git commit -m "feat: add courier module with Bosta/Mylerz providers and remittance"
```
