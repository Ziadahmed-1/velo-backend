import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppAccount } from './entities/whatsapp-account.entity';
import { WhatsAppConversation } from './entities/whatsapp-conversation.entity';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import {
  WhatsAppMessageDirection,
  WhatsAppConversationStatus,
} from '../../common/enums';
import { MessageToOrderService } from './message-to-order.service';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectRepository(WhatsAppAccount)
    private accountRepo: Repository<WhatsAppAccount>,
    @InjectRepository(WhatsAppConversation)
    private conversationRepo: Repository<WhatsAppConversation>,
    @InjectRepository(WhatsAppMessage)
    private messageRepo: Repository<WhatsAppMessage>,
    private messageToOrderService: MessageToOrderService,
  ) {}

  async findAccountByBspChannel(
    bspChannelId: string,
  ): Promise<WhatsAppAccount | null> {
    return this.accountRepo.findOne({ where: { bspChannelId } });
  }

  async handleIncoming(
    accountId: string,
    payload: { from: string; text: string; bspMessageId: string },
  ): Promise<{ success: boolean }> {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');

    let conversation = await this.conversationRepo.findOne({
      where: {
        whatsAppAccountId: account.id,
        customerPhone: payload.from,
        status: WhatsAppConversationStatus.OPEN,
      },
    });
    if (!conversation) {
      conversation = this.conversationRepo.create({
        whatsAppAccountId: account.id,
        customerPhone: payload.from,
      });
      conversation = await this.conversationRepo.save(conversation);
    }

    const message = this.messageRepo.create({
      conversationId: conversation.id,
      bspMessageId: payload.bspMessageId,
      direction: WhatsAppMessageDirection.INBOUND,
      rawText: payload.text,
    });
    await this.messageRepo.save(message);

    conversation.lastMessageAt = new Date();
    await this.conversationRepo.save(conversation);

    try {
      const order: Order = await this.messageToOrderService.process(
        accountId,
        payload.text,
      );
      if (order) {
        conversation.status = WhatsAppConversationStatus.DRAFT_ORDER_CREATED;
        await this.conversationRepo.save(conversation);
        await this.sendText(
          accountId,
          payload.from,
          `Order #${order.id.substring(0, 8)} created! We'll review it shortly.`,
        );
      }
    } catch (err) {
      this.logger.error('Failed to process message to order', err);
      await this.sendText(
        accountId,
        payload.from,
        'Thanks! We received your message and will get back to you.',
      );
    }

    return { success: true };
  }

  async sendText(
    accountId: string,
    to: string,
    text: string,
  ): Promise<{ messages?: Array<{ id: string }> }> {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');

    const response = await fetch('https://waba-v2.360dialog.io/v1/messages', {
      method: 'POST',
      headers: {
        'D360-API-KEY': account.accessTokenRef,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      this.logger.error(`360dialog send failed: ${response.status} ${errBody}`);
      throw new Error(`Failed to send WhatsApp message: ${response.status}`);
    }

    const result = (await response.json()) as {
      messages?: Array<{ id: string }>;
    };
    const bspMessageId = result.messages?.[0]?.id;

    const conversation = await this.conversationRepo.findOne({
      where: { customerPhone: to },
      order: { lastMessageAt: 'DESC' },
    });
    if (conversation) {
      const msg = this.messageRepo.create({
        conversationId: conversation.id,
        bspMessageId: bspMessageId || `out-${Date.now()}`,
        direction: WhatsAppMessageDirection.OUTBOUND,
        rawText: text,
      });
      await this.messageRepo.save(msg);
    }

    return result;
  }

  async getConversations(accountId: string) {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');
    return this.conversationRepo.find({
      where: { whatsAppAccountId: account.id },
      relations: { messages: true },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getMessages(accountId: string, conversationId: string) {
    const account = await this.accountRepo.findOne({ where: { accountId } });
    if (!account) throw new NotFoundException('WhatsApp account not found');
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, whatsAppAccountId: account.id },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}
