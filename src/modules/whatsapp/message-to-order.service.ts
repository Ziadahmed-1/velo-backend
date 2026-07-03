import { Injectable, Logger } from '@nestjs/common';
import { PasteParseService } from '../paste-parse/paste-parse.service';
import { PasteParseDto } from '../paste-parse/dto/paste-parse.dto';
import { WhatsAppConversation } from './entities/whatsapp-conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

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

  async process(accountId: string, text: string) {
    const dto = new PasteParseDto();
    dto.text = text;
    const order = await this.pasteParseService.parse(accountId, dto);
    return order;
  }
}
