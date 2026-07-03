import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { WhatsAppService } from '../../../src/modules/whatsapp/whatsapp.service';
import { MessageToOrderService } from '../../../src/modules/whatsapp/message-to-order.service';
import { WhatsAppAccount } from '../../../src/modules/whatsapp/entities/whatsapp-account.entity';
import { WhatsAppConversation } from '../../../src/modules/whatsapp/entities/whatsapp-conversation.entity';
import { WhatsAppMessage } from '../../../src/modules/whatsapp/entities/whatsapp-message.entity';
import { WhatsAppConversationStatus } from '../../../src/common/enums';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let accountRepo: { findOne: jest.Mock };
  let conversationRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let messageRepo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let messageToOrderService: { process: jest.Mock };

  const mockAccount = {
    id: 'wa-1',
    accountId: 'acc-1',
    phoneNumber: '201234567890',
    bspChannelId: 'ch-1',
    accessTokenRef: 'token-1',
  };
  const mockConversation = {
    id: 'conv-1',
    whatsAppAccountId: 'wa-1',
    customerPhone: '201234567891',
    status: WhatsAppConversationStatus.OPEN,
    lastMessageAt: new Date(),
  };

  beforeEach(async () => {
    accountRepo = {
      findOne: jest.fn().mockResolvedValue(mockAccount),
    };
    conversationRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(mockConversation),
    };
    messageRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      find: jest.fn().mockResolvedValue([]),
    };
    messageToOrderService = {
      process: jest.fn().mockResolvedValue({ id: 'order-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: getRepositoryToken(WhatsAppAccount), useValue: accountRepo },
        {
          provide: getRepositoryToken(WhatsAppConversation),
          useValue: conversationRepo,
        },
        { provide: getRepositoryToken(WhatsAppMessage), useValue: messageRepo },
        { provide: MessageToOrderService, useValue: messageToOrderService },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    jest.spyOn(service, 'sendText').mockResolvedValue({});
  });

  it('should handle incoming message and create conversation', async () => {
    const result = await service.handleIncoming('acc-1', {
      from: '201234567891',
      text: 'Hello',
      bspMessageId: 'bsp-1',
    });
    expect(result.success).toBe(true);
    expect(messageRepo.create).toHaveBeenCalled();
    expect(conversationRepo.create).toHaveBeenCalled();
  });

  it('should throw if account not found', async () => {
    accountRepo.findOne.mockResolvedValue(null);
    await expect(
      service.handleIncoming('bad-acc', {
        from: '201234567891',
        text: 'Hi',
        bspMessageId: 'bsp-2',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reuse existing conversation', async () => {
    conversationRepo.findOne.mockResolvedValue(mockConversation);
    await service.handleIncoming('acc-1', {
      from: '201234567891',
      text: 'Hello again',
      bspMessageId: 'bsp-3',
    });
    expect(conversationRepo.create).not.toHaveBeenCalled();
  });

  it('should find account by bsp channel id', async () => {
    const result = await service.findAccountByBspChannel('ch-1');
    expect(result).toEqual(mockAccount);
    expect(accountRepo.findOne).toHaveBeenCalledWith({
      where: { bspChannelId: 'ch-1' },
    });
  });
});
