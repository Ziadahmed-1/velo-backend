import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppTemplate } from './entities/whatsapp-template.entity';
import { WhatsAppAccount } from './entities/whatsapp-account.entity';

interface TemplateApiItem {
  name: string;
  status: string;
  category: string;
}

interface TemplateApiResponse {
  data?: TemplateApiItem[];
  waba_templates?: TemplateApiItem[];
}

@Injectable()
export class WhatsAppTemplateService {
  constructor(
    @InjectRepository(WhatsAppTemplate)
    private templateRepo: Repository<WhatsAppTemplate>,
    @InjectRepository(WhatsAppAccount)
    private accountRepo: Repository<WhatsAppAccount>,
  ) {}

  async findAll(accountId: string): Promise<WhatsAppTemplate[]> {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');
    return this.templateRepo.find({ where: { whatsAppAccountId: account.id } });
  }

  async syncFromBsp(accountId: string): Promise<WhatsAppTemplate[]> {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');

    const response = await fetch(
      'https://waba-v2.360dialog.io/v1/configs/templates',
      {
        headers: { 'D360-API-KEY': account.accessTokenRef },
      },
    );

    if (!response.ok)
      throw new Error(`Failed to sync templates: ${response.status}`);

    const data = (await response.json()) as TemplateApiResponse;
    const templates: TemplateApiItem[] = data.data || data.waba_templates || [];

    for (const tpl of templates) {
      const existing = await this.templateRepo.findOne({
        where: { whatsAppAccountId: account.id, name: tpl.name },
      });
      if (existing) {
        existing.approvalStatus = tpl.status || existing.approvalStatus;
        existing.category = tpl.category || existing.category;
        await this.templateRepo.save(existing);
      } else {
        await this.templateRepo.save(
          this.templateRepo.create({
            whatsAppAccountId: account.id,
            name: tpl.name,
            category: tpl.category || '',
            approvalStatus: tpl.status || 'PENDING',
          }),
        );
      }
    }

    return this.findAll(accountId);
  }
}
