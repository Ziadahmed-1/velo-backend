import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppAccount } from './entities/whatsapp-account.entity';
import { WhatsAppConversation } from './entities/whatsapp-conversation.entity';
import { WhatsAppMessage } from './entities/whatsapp-message.entity';
import { WhatsAppTemplate } from './entities/whatsapp-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppAccount,
      WhatsAppConversation,
      WhatsAppMessage,
      WhatsAppTemplate,
    ]),
  ],
})
export class WhatsAppModule {}
