import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BostaProvider } from '../../../src/modules/courier/providers/bosta.provider';

describe('BostaProvider', () => {
  let provider: BostaProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BostaProvider,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-key') },
        },
      ],
    }).compile();
    provider = module.get<BostaProvider>(BostaProvider);
  });

  it('should create shipment and return tracking number', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          trackingNumber: 'BOSTA-123',
          labelUrl: 'https://bosta.com/label',
        },
      }),
    });
    globalThis.fetch = mockFetch;

    const order = {
      id: 'ord-1',
      totalAmount: '100',
      courierProvider: 'bosta',
    } as const;
    const customer = {
      name: 'Test User',
      phone: '01000000000',
      governorate: 'Cairo',
      district: 'Nasr City',
      streetAddress: 'Main St',
    } as const;
    const result = await provider.createShipment(
      order as never,
      customer as never,
    );
    expect(result.trackingNumber).toBe('BOSTA-123');
    expect(result.labelUrl).toBe('https://bosta.com/label');
  });

  it('should map Bosta status to internal status', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          status: 'DELIVERED',
          lastEvent: 'Package delivered',
          lastEventDate: new Date().toISOString(),
        },
      }),
    });
    globalThis.fetch = mockFetch;

    const result = await provider.trackShipment('BOSTA-123');
    expect(result.status).toBe('DELIVERED');
  });

  it('should throw on API error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
    });
    globalThis.fetch = mockFetch;

    const order = {
      id: 'ord-1',
      totalAmount: '100',
      courierProvider: 'bosta',
    } as const;
    const customer = {
      name: 'Test User',
      phone: '01000000000',
      governorate: 'Cairo',
      district: 'Nasr City',
      streetAddress: 'Main St',
    } as const;
    await expect(
      provider.createShipment(order as never, customer as never),
    ).rejects.toThrow('Bosta API error: 401 Unauthorized');
  });

  it('should cancel shipment', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValue({ ok: true, text: jest.fn().mockResolvedValue('') });
    globalThis.fetch = mockFetch;

    await expect(provider.cancelShipment('BOSTA-123')).resolves.toBeUndefined();
  });
});
