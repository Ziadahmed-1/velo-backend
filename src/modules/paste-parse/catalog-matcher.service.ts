import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { MatchStatus } from '../../common/enums';

export interface MatchResult {
  extractedName: string;
  matchStatus: MatchStatus;
  matchedVariantId: string | null;
  matchConfidence: number | null;
  suggestedAlternatives: Array<{
    variantId: string;
    name: string;
    price: string;
    reason: string;
  }> | null;
  quantity: number;
  price: string;
}

@Injectable()
export class CatalogMatcherService {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.modelName =
      this.configService.get<string>('OPENROUTER_MODEL') ||
      'meta-llama/llama-3.1-70b-instruct';
  }

  async matchItems(
    accountId: string,
    items: Array<{ name: string; qty: number; price: string }>,
  ): Promise<MatchResult[]> {
    const catalog = await this.variantRepo.find({
      where: { accountId },
      select: { id: true, sku: true, price: true, attributesJson: true },
    });

    const systemPrompt = `You are matching extracted order items against a merchant's product catalog. For each extracted item, either find the exact match in the catalog, suggest 1-3 similar alternatives, or mark as no-match. Respond as JSON array only: [{ extractedName, matchStatus: 'HIGH_CONFIDENCE'|'AMBIGUOUS'|'NO_MATCH', matchedVariantId, matchConfidence (0-100), suggestedAlternatives: [{ variantId, name, price, reason }], quantity, price }]. No markdown, no code fences.`;

    const userPrompt = `Catalog:\n${JSON.stringify(catalog)}\n\nExtracted items:\n${JSON.stringify(items)}`;

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = {
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);
      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in response');
      const parsed = JSON.parse(content) as MatchResult[];
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');
      return parsed;
    } catch {
      throw new HttpException('Catalog matching service unavailable', 502);
    }
  }
}
