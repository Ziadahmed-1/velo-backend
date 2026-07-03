import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExtractionService } from '../../../src/modules/paste-parse/extraction.service';

describe('ExtractionService', () => {
  let service: ExtractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-key') },
        },
      ],
    }).compile();
    service = module.get<ExtractionService>(ExtractionService);
  });

  it('should build correct OpenRouter request', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content:
                '{"customerName":"Test","phone":"01000000000","governorate":"Cairo","district":"Nasr City","street":"Main St","items":[{"name":"Item 1","qty":2,"price":"50"}],"shippingFee":"10","total":"110"}',
            },
          },
        ],
      }),
    });
    (global as { fetch: unknown }).fetch = mockFetch;

    const result = await service.extractFromText('test order text');
    expect(result.customerName).toBe('Test');
    expect(result.items).toHaveLength(1);
  });

  it('should throw on non-JSON response after retry', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'not json' } }],
      }),
    });
    (global as { fetch: unknown }).fetch = mockFetch;

    await expect(service.extractFromText('test')).rejects.toThrow(
      'Extraction service unavailable',
    );
  });
});
