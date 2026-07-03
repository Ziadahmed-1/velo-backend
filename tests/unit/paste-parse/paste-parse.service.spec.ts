import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PasteParseService } from '../../../src/modules/paste-parse/paste-parse.service';
import { ExtractionService } from '../../../src/modules/paste-parse/extraction.service';
import { CatalogMatcherService } from '../../../src/modules/paste-parse/catalog-matcher.service';
import { Customer } from '../../../src/modules/customers/entities/customer.entity';
import { Order } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';
import { SuggestedItem } from '../../../src/modules/products/entities/suggested-item.entity';

describe('PasteParseService', () => {
  let service: PasteParseService;
  let extractionService: Record<string, jest.Mock>;
  let catalogMatcherService: Record<string, jest.Mock>;

  beforeEach(async () => {
    extractionService = { extractFromText: jest.fn() };
    catalogMatcherService = { matchItems: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasteParseService,
        { provide: ExtractionService, useValue: extractionService },
        { provide: CatalogMatcherService, useValue: catalogMatcherService },
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest
              .fn()
              .mockImplementation(
                (data: Record<string, unknown>) => data ?? {},
              ),
            save: jest
              .fn()
              .mockImplementation((entity: Record<string, unknown>) =>
                Promise.resolve({ ...entity, id: 'customer-1' }),
              ),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { findOne: jest.fn() },
        },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        {
          provide: getRepositoryToken(SuggestedItem),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                create: jest
                  .fn()
                  .mockImplementation(
                    (_entity: unknown, data: Record<string, unknown>) =>
                      data ?? {},
                  ),
                save: jest
                  .fn()
                  .mockImplementation((entity: Record<string, unknown>) =>
                    Promise.resolve({ ...entity, id: 'order-1' }),
                  ),
                findOne: jest.fn().mockResolvedValue(null),
              },
            })),
          },
        },
      ],
    }).compile();
    service = module.get<PasteParseService>(PasteParseService);
  });

  it('should create draft order from pasted text', async () => {
    extractionService.extractFromText.mockResolvedValue({
      customerName: 'Test',
      phone: '01000000000',
      governorate: 'Cairo',
      district: 'Nasr City',
      street: 'Main St',
      items: [{ name: 'Item', qty: 1, price: '50' }],
      shippingFee: '10',
      total: '60',
    });
    catalogMatcherService.matchItems.mockResolvedValue([
      {
        extractedName: 'Item',
        matchStatus: 'NO_MATCH',
        matchedVariantId: null,
        matchConfidence: null,
        suggestedAlternatives: null,
        quantity: 1,
        price: '50',
      },
    ]);

    const result = await service.parse('acc-1', { text: 'test' });
    expect(result.isDraft).toBe(true);
  });
});
