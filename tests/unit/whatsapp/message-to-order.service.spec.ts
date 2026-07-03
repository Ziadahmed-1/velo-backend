import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageToOrderService } from '../../../src/modules/whatsapp/message-to-order.service';
import { PasteParseService } from '../../../src/modules/paste-parse/paste-parse.service';
import { WhatsAppConversation } from '../../../src/modules/whatsapp/entities/whatsapp-conversation.entity';
import { Order } from '../../../src/modules/orders/entities/order.entity';

describe('MessageToOrderService', () => {
  let service: MessageToOrderService;
  let pasteParseService: { parse: jest.Mock };

  beforeEach(async () => {
    pasteParseService = {
      parse: jest.fn().mockResolvedValue({ id: 'order-1', isDraft: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageToOrderService,
        { provide: PasteParseService, useValue: pasteParseService },
        {
          provide: getRepositoryToken(WhatsAppConversation),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MessageToOrderService>(MessageToOrderService);
  });

  it('should call pasteParseService.parse with the text', async () => {
    const result = await service.process('acc-1', 'I want 2 kilos of apples');
    expect(pasteParseService.parse).toHaveBeenCalledWith(
      'acc-1',
      expect.objectContaining({ text: 'I want 2 kilos of apples' }),
    );
    expect(result.id).toBe('order-1');
  });
});
