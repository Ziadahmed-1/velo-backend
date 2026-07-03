import { Injectable, Logger } from '@nestjs/common';
import { PasteParseService } from '../paste-parse/paste-parse.service';
import { PasteParseDto } from '../paste-parse/dto/paste-parse.dto';
import { WhatsAppConversation } from './entities/whatsapp-conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

/**
 * Converts incoming WhatsApp text to draft Order via PasteParseService.
 */
@Injectable()
export class MessageToOrderService {
  private readonly logger = new Logger(MessageToOrderService.name);

  constructor(
    private pasteParseService: PasteParseService,
    @InjectRepository(WhatsAppConversation)
    private conversationRepo: Repository<WhatsAppConversation>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /**
   * Parse incoming WhatsApp text into a draft order.
   * @param accountId - Tenant account ID
   * @param text - Raw message text from customer
   * @returns The created Order draft or null if parsing fails
   */
  async process(accountId: string, text: string) {
    const dto = new PasteParseDto();
    dto.text = text;
    const order = await this.pasteParseService.parse(accountId, dto);
    return order;
  }
}
