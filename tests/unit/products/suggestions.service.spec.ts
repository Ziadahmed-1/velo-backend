import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from '../../../src/modules/products/products.service';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { ProductVariant } from '../../../src/modules/products/entities/product-variant.entity';
import { SuggestedItem } from '../../../src/modules/products/entities/suggested-item.entity';

describe('ProductsService (suggestions)', () => {
  let service: ProductsService;
  let suggestionRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let variantRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let productRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockSuggestion = {
    id: 'sg-1',
    accountId: 'acc-1',
    rawName: 'Green Tea',
    timesMentioned: 5,
    isDismissed: false,
    linkedVariantId: null,
  };
  const mockProduct = {
    id: 'prod-1',
    accountId: 'acc-1',
    title: 'Beverages',
  };
  const mockVariant = {
    id: 'var-1',
    accountId: 'acc-1',
    productId: 'prod-1',
    sku: 'GT-001',
    price: '15',
  };

  beforeEach(async () => {
    suggestionRepo = {
      find: jest.fn().mockResolvedValue([mockSuggestion]),
      findOne: jest.fn().mockResolvedValue(mockSuggestion),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };
    variantRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(mockVariant),
    };
    productRepo = {
      findOne: jest.fn().mockResolvedValue(mockProduct),
      find: jest.fn().mockResolvedValue([mockProduct]),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        {
          provide: getRepositoryToken(SuggestedItem),
          useValue: suggestionRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should list suggestions', async () => {
    const result = await service.getSuggestions('acc-1');
    expect(result).toHaveLength(1);
    expect(suggestionRepo.find).toHaveBeenCalledWith({
      where: { accountId: 'acc-1', isDismissed: false },
      order: { timesMentioned: 'DESC' },
    });
  });

  it('should dismiss a suggestion', async () => {
    const result = await service.dismissSuggestion('acc-1', 'sg-1');
    expect(result.isDismissed).toBe(true);
  });

  it('should throw on dismiss if not found', async () => {
    suggestionRepo.findOne.mockResolvedValue(null);
    await expect(service.dismissSuggestion('acc-1', 'bad-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create variant from suggestion', async () => {
    const result = await service.createVariantFromSuggestion('acc-1', 'sg-1', {
      productId: 'prod-1',
      sku: 'GT-001',
      price: 15,
    });
    expect(variantRepo.create).toHaveBeenCalled();
    expect(result.sku).toBe('GT-001');
  });

  it('should throw if suggestion already linked', async () => {
    suggestionRepo.findOne.mockResolvedValue({
      ...mockSuggestion,
      linkedVariantId: 'var-existing',
    });
    await expect(
      service.createVariantFromSuggestion('acc-1', 'sg-1', {
        productId: 'prod-1',
        sku: 'GT-001',
        price: 15,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
