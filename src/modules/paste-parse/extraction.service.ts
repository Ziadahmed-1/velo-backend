import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class ExtractionService {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.modelName =
      this.configService.get<string>('OPENROUTER_MODEL') ||
      'meta-llama/llama-3.1-70b-instruct';
  }

  async extractFromText(text: string): Promise<ExtractedOrderData> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    const systemPrompt =
      'Extract structured order data from this Arabic/English text. Return JSON with { customerName, phone, governorate, district, street, items: [{name, qty, price}], shippingFee, total }. No markdown, no code fences, only valid JSON.';

    const attempt = async (retryMsg?: string): Promise<ExtractedOrderData> => {
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: retryMsg || systemPrompt },
        { role: 'user', content: text },
      ];
      const body = { model: this.modelName, messages };
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
      const parsed = JSON.parse(content) as ExtractedOrderData;
      if (
        !parsed.customerName ||
        !parsed.phone ||
        !parsed.items ||
        !Array.isArray(parsed.items)
      ) {
        throw new Error('Missing required fields');
      }
      return parsed;
    };

    try {
      return await attempt();
    } catch {
      try {
        return await attempt('Please respond with valid JSON only.');
      } catch {
        throw new HttpException('Extraction service unavailable', 502);
      }
    }
  }
}
