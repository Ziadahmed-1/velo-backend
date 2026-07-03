import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CatalogMatcherService } from '../../../src/modules/paste-parse/catalog-matcher.service';
import { ProductVariant } from '../../../src/modules/products/entities/product-variant.entity';

describe('CatalogMatcherService', () => {
  let service: CatalogMatcherService;
  let variantRepo: { find: jest.Mock };

  beforeEach(async () => {
    variantRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'v1', name: 'شاي عدني', price: '25', attributesJson: {} },
        { id: 'v2', name: 'قهوة سادة', price: '30', attributesJson: {} },
      ]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogMatcherService,
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-key') },
        },
      ],
    }).compile();
    service = module.get<CatalogMatcherService>(CatalogMatcherService);
  });

  it('should fetch catalog and delegate to LLM for matching', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  extractedName: 'شاي عدني',
                  matchStatus: 'HIGH_CONFIDENCE',
                  matchedVariantId: 'v1',
                  matchConfidence: 95,
                  suggestedAlternatives: null,
                  quantity: 2,
                  price: '25',
                },
              ]),
            },
          },
        ],
      }),
    });
    (global as { fetch: unknown }).fetch = mockFetch;

    const result = await service.matchItems('acc-1', [
      { name: 'شاي عدني', qty: 2, price: '25' },
    ]);
    expect(result[0].matchStatus).toBe('HIGH_CONFIDENCE');
    expect(result[0].matchedVariantId).toBe('v1');
  });
});
