import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppTemplateService } from './whatsapp-template.service';
import { WhatsAppWebhookPayload } from './dto/whatsapp-webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@ApiBearerAuth()
@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private whatsAppService: WhatsAppService,
    private templateService: WhatsAppTemplateService,
  ) {}

  @ApiOperation({
    summary: 'Verify webhook',
    description:
      '360dialog webhook verification endpoint. Returns hub.challenge when token matches.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook verified, returns challenge string.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification failed if token mismatch.',
  })
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

  @ApiOperation({
    summary: 'Receive incoming message',
    description:
      '360dialog incoming message webhook. Processes text messages, creates conversations, and generates draft orders.',
  })
  @ApiResponse({ status: 201, description: 'Webhook processed successfully.' })
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

  @ApiOperation({
    summary: 'Send text message',
    description:
      'Sends a text message to a customer via 360dialog WhatsApp API.',
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  @ApiResponse({ status: 404, description: 'WhatsApp account not found.' })
  @Post('send')
  async sendMessage(
    @CurrentAccount() user: RequestUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.whatsAppService.sendText(user.accountId, dto.to, dto.text);
  }

  @ApiOperation({
    summary: 'List conversations',
    description:
      'Returns all WhatsApp conversations for the current account with their messages.',
  })
  @ApiResponse({ status: 200, description: 'Conversations list returned.' })
  @Get('conversations')
  async getConversations(@CurrentAccount() user: RequestUser) {
    return this.whatsAppService.getConversations(user.accountId);
  }

  @ApiOperation({
    summary: 'Get conversation messages',
    description: 'Returns all messages for a specific WhatsApp conversation.',
  })
  @ApiResponse({ status: 200, description: 'Messages returned.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentAccount() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.whatsAppService.getMessages(user.accountId, id);
  }

  @ApiOperation({
    summary: 'List WhatsApp templates',
    description:
      'Returns all synced WhatsApp message templates for the current account.',
  })
  @ApiResponse({ status: 200, description: 'Templates list returned.' })
  @Get('templates')
  async getTemplates(@CurrentAccount() user: RequestUser) {
    return this.templateService.findAll(user.accountId);
  }

  @ApiOperation({
    summary: 'Sync WhatsApp templates',
    description:
      'Fetches the latest WhatsApp message templates from 360dialog and stores them locally.',
  })
  @ApiResponse({ status: 201, description: 'Templates synced successfully.' })
  @Post('templates/sync')
  async syncTemplates(@CurrentAccount() user: RequestUser) {
    return this.templateService.syncFromBsp(user.accountId);
  }
}
