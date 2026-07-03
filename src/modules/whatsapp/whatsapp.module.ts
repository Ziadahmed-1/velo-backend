import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppAccount } from './entities/whatsapp-account.entity';
import { WhatsAppConversation } from './entities/whatsapp-conversation.entity';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import { WhatsAppTemplate } from './entities/whatsapp-template.entity';
import { Order } from '../orders/entities/order.entity';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppTemplateService } from './whatsapp-template.service';
import { MessageToOrderService } from './message-to-order.service';
import { PasteParseModule } from '../paste-parse/paste-parse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppAccount,
      WhatsAppConversation,
      WhatsAppMessage,
      WhatsAppTemplate,
      Order,
    ]),
    PasteParseModule,
  ],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppService, WhatsAppTemplateService, MessageToOrderService],
})
export class WhatsAppModule {}
