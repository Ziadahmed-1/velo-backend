import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppTemplateService } from './whatsapp-template.service';
import { WhatsAppWebhookPayload } from './dto/whatsapp-webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private whatsAppService: WhatsAppService,
    private templateService: WhatsAppTemplateService,
  ) {}

  @Public()
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken =
      process.env.WHATSAPP_VERIFY_TOKEN || 'velo-verify-token';
    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Webhook verified');
      return challenge;
    }
    this.logger.warn('Webhook verification failed');
    return 'Verification failed';
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Body() body: WhatsAppWebhookPayload) {
    this.logger.debug(
      `Webhook received: ${JSON.stringify(body).substring(0, 200)}`,
    );

    if (!body.entry) return { success: true };

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const messages = value.messages || [];

        const account = await this.whatsAppService.findAccountByBspChannel(
          value.metadata.phone_number_id,
        );
        if (!account) {
          this.logger.warn(
            `No account for phone: ${value.metadata.phone_number_id}`,
          );
          continue;
        }

        for (const msg of messages) {
          if (msg.type === 'text' && msg.text?.body) {
            await this.whatsAppService.handleIncoming(account.accountId, {
              from: msg.from,
              text: msg.text.body,
              bspMessageId: msg.id,
            });
          }
        }
      }
    }

    return { success: true };
  }

  @Post('send')
  async sendMessage(
    @CurrentAccount() user: RequestUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.whatsAppService.sendText(user.accountId, dto.to, dto.text);
  }

  @Get('conversations')
  async getConversations(@CurrentAccount() user: RequestUser) {
    return this.whatsAppService.getConversations(user.accountId);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.whatsAppService.getMessages(user.accountId, id);
  }

  @Get('templates')
  async getTemplates(@CurrentAccount() user: RequestUser) {
    return this.templateService.findAll(user.accountId);
  }

  @Post('templates/sync')
  async syncTemplates(@CurrentAccount() user: RequestUser) {
    return this.templateService.syncFromBsp(user.accountId);
  }
}
