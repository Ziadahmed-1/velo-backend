# Task 2: Paste-Parse Module — LLM Extraction + Catalog Matching

## Files to create/modify
- Create: `src/modules/paste-parse/paste-parse.module.ts`
- Create: `src/modules/paste-parse/paste-parse.controller.ts`
- Create: `src/modules/paste-parse/paste-parse.service.ts`
- Create: `src/modules/paste-parse/extraction.service.ts`
- Create: `src/modules/paste-parse/catalog-matcher.service.ts`
- Create: `src/modules/paste-parse/dto/paste-parse.dto.ts`
- Modify: `src/app.module.ts`

## DTOs

**src/modules/paste-parse/dto/paste-parse.dto.ts:**
```typescript
import { IsString } from 'class-validator';

export class PasteParseDto {
  @IsString()
  text: string;
}
```

## ExtractionService

**src/modules/paste-parse/extraction.service.ts:**
- Injects `ConfigService` for `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`
- Method `extractFromText(text: string): Promise<ExtractedOrderData>`
- Sends POST to `https://openrouter.ai/api/v1/chat/completions` with:
  - Headers: `Authorization: Bearer ${apiKey}`, `Content-Type: application/json`
  - Body: `{ model: modelName, messages: [{ role: 'system', content: 'Extract structured order data from this Arabic/English text. Return JSON with { customerName, phone, governorate, district, street, items: [{name, qty, price}], shippingFee, total }. No markdown, no code fences, only valid JSON.' }, { role: 'user', content: text }] }`
  - On failure: retry once with `"Please respond with valid JSON only."`
  - Parse response, validate required fields
  - Throw `HttpException(502, 'Extraction service unavailable')` on persistent failure

```typescript
export interface ExtractedOrderData {
  customerName: string;
  phone: string;
  governorate: string;
  district: string;
  street: string;
  items: Array<{ name: string; qty: number; price: string }>;
  shippingFee: string;
  total: string;
}
```

## CatalogMatcherService

**src/modules/paste-parse/catalog-matcher.service.ts:**
- Injects `ConfigService` for API key + model
- Injects `InjectRepository(ProductVariant)`
- Method `matchItems(accountId: string, items: Array<{name: string}>, extractedData: ExtractedOrderData)`
- Fetches merchant's full catalog: `this.variantRepo.find({ where: { accountId }, select: ['id', 'name', 'price', 'attributesJson'] })`
- Second LLM call with catalog as context:
  - Prompt: "You are matching extracted order items against a merchant's product catalog. For each extracted item, either find the exact match in the catalog, suggest 1-3 similar alternatives, or mark as no-match. Respond as JSON array: [{ extractedName, matchStatus: 'HIGH_CONFIDENCE'|'AMBIGUOUS'|'NO_MATCH', matchedVariantId, matchConfidence (0-100), suggestedAlternatives: [{ variantId, name, price, reason }] }]"
- Returns structured match results

```typescript
export interface MatchResult {
  extractedName: string;
  matchStatus: MatchStatus;
  matchedVariantId: string | null;
  matchConfidence: number | null;
  suggestedAlternatives: Array<{ variantId: string; name: string; price: string; reason: string }> | null;
  quantity: number;
  price: string;
}
```

## PasteParseService

**src/modules/paste-parse/paste-parse.service.ts:**
- Injects: ExtractionService, CatalogMatcherService, DataSource (for QueryRunner), InjectRepository(Customer), InjectRepository(Order), InjectRepository(SuggestedItem)
- Method `parse(accountId: string, dto: PasteParseDto)`
  1. Call `extractionService.extractFromText(dto.text)` → ExtractedOrderData
  2. Find or create Customer by phone (check existing, create if not found)
  3. Call `catalogMatcherService.matchItems(accountId, extractedItems, extractedData)` → MatchResult[]
  4. Use QueryRunner to atomically:
     a. Create draft Order with isDraft: true, sourceChannel: PASTE_PARSE, conversationContext (store LLM response)
     b. Create OrderItems with match data
     c. Upsert SuggestedItem for NO_MATCH items (find by rawName + accountId, increment timesMentioned or create)
  5. Return PasteParseResponse with full order detail

## PasteParseController

**src/modules/paste-parse/paste-parse.controller.ts:**
```typescript
@Controller('paste-parse')
export class PasteParseController {
  constructor(private pasteParseService: PasteParseService) {}

  @Post()
  parse(@CurrentAccount() user: RequestUser, @Body() dto: PasteParseDto) {
    return this.pasteParseService.parse(user.accountId, dto);
  }
}
```

## PasteParseModule

**src/modules/paste-parse/paste-parse.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasteParseController } from './paste-parse.controller';
import { PasteParseService } from './paste-parse.service';
import { ExtractionService } from './extraction.service';
import { CatalogMatcherService } from './catalog-matcher.service';
import { Customer } from '../customers/entities/customer.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { SuggestedItem } from '../products/entities/suggested-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Order, OrderItem, ProductVariant, SuggestedItem]),
  ],
  controllers: [PasteParseController],
  providers: [PasteParseService, ExtractionService, CatalogMatcherService],
  exports: [ExtractionService, CatalogMatcherService],
})
export class PasteParseModule {}
```

## AppModule changes

Add `PasteParseModule` to the imports array in `src/app.module.ts`:
```typescript
import { PasteParseModule } from './modules/paste-parse/paste-parse.module';
// In imports array:
PasteParseModule,
```

## .env.example additions
```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

## Testing

```typescript
// tests/unit/paste-parse/extraction.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExtractionService } from '../../src/modules/paste-parse/extraction.service';

describe('ExtractionService', () => {
  let service: ExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();
    service = module.get<ExtractionService>(ExtractionService);
  });

  it('should build correct OpenRouter request', async () => {
    // Mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"customerName":"Test","phone":"01000000000","governorate":"Cairo","district":"Nasr City","street":"Main St","items":[{"name":"Item 1","qty":2,"price":"50"}],"shippingFee":"10","total":"110"}' } }],
      }),
    });
    (global as any).fetch = mockFetch;

    const result = await service.extractFromText('test order text');
    expect(result.customerName).toBe('Test');
    expect(result.items).toHaveLength(1);
  });

  it('should throw on non-JSON response after retry', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    });
    (global as any).fetch = mockFetch;

    await expect(service.extractFromText('test')).rejects.toThrow();
  });
});

// tests/unit/paste-parse/catalog-matcher.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CatalogMatcherService } from '../../src/modules/paste-parse/catalog-matcher.service';
import { ProductVariant } from '../../src/modules/products/entities/product-variant.entity';

describe('CatalogMatcherService', () => {
  let service: CatalogMatcherService;
  let variantRepo: any;

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
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();
    service = module.get<CatalogMatcherService>(CatalogMatcherService);
  });

  it('should fetch catalog and delegate to LLM for matching', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify([
              { extractedName: 'شاي عدني', matchStatus: 'HIGH_CONFIDENCE', matchedVariantId: 'v1', matchConfidence: 95, suggestedAlternatives: null, quantity: 2, price: '25' },
            ]),
          },
        }],
      }),
    });
    (global as any).fetch = mockFetch;

    const result = await service.matchItems('acc-1', [{ name: 'شاي عدني', qty: 2, price: '25' }]);
    expect(result[0].matchStatus).toBe('HIGH_CONFIDENCE');
    expect(result[0].matchedVariantId).toBe('v1');
  });

  it('should return alternatives when no exact match', async () => {
    // similar test with AMBIGUOUS response
  });
});

// tests/unit/paste-parse/paste-parse.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PasteParseService } from '../../src/modules/paste-parse/paste-parse.service';
import { ExtractionService } from '../../src/modules/paste-parse/extraction.service';
import { CatalogMatcherService } from '../../src/modules/paste-parse/catalog-matcher.service';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Order } from '../../src/modules/orders/entities/order.entity';
import { SuggestedItem } from '../../src/modules/products/entities/suggested-item.entity';

describe('PasteParseService', () => {
  let service: PasteParseService;
  let extractionService: any;
  let catalogMatcherService: any;

  beforeEach(async () => {
    extractionService = { extractFromText: jest.fn() };
    catalogMatcherService = { matchItems: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasteParseService,
        { provide: ExtractionService, useValue: extractionService },
        { provide: CatalogMatcherService, useValue: catalogMatcherService },
        { provide: getRepositoryToken(Customer), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(SuggestedItem), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn(() => ({
          connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(), release: jest.fn(),
          manager: { create: jest.fn(), save: jest.fn().mockResolvedValue({ id: 'order-1' }) },
        })) } },
      ],
    }).compile();
    service = module.get<PasteParseService>(PasteParseService);
  });

  it('should create draft order from pasted text', async () => {
    extractionService.extractFromText.mockResolvedValue({
      customerName: 'Test', phone: '01000000000', governorate: 'Cairo',
      district: 'Nasr City', street: 'Main St', items: [{ name: 'Item', qty: 1, price: '50' }],
      shippingFee: '10', total: '60',
    });
    catalogMatcherService.matchItems.mockResolvedValue([
      { extractedName: 'Item', matchStatus: 'NO_MATCH', matchedVariantId: null, matchConfidence: null, suggestedAlternatives: null, quantity: 1, price: '50' },
    ]);

    const result = await service.parse('acc-1', { text: 'test' });
    expect(result.isDraft).toBe(true);
  });
});
```

## Important notes
- Use `import type { RequestUser }` not `import { RequestUser }` for controller parameters
- Existing tests must still pass after changes
- Run lint before committing: `npx eslint --ext .ts src/ tests/`
- No new npm dependencies — use native `fetch` for OpenRouter calls

## Commit
```bash
git add src/modules/paste-parse/ src/app.module.ts
git commit -m "feat: add paste-parse module with LLM extraction and catalog matching"
```
