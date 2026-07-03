import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WhatsAppMessageDirection } from '../../../common/enums';
import { WhatsAppConversation } from './whatsapp-conversation.entity';

@Entity('whatsapp_messages')
@Index(['conversationId', 'createdAt'])
export class WhatsAppMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @ManyToOne(
    () => WhatsAppConversation,
    (conversation) => conversation.messages,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'conversationId' })
  conversation: WhatsAppConversation;

  @Column({ unique: true })
  bspMessageId: string;

  @Column({ type: 'enum', enum: WhatsAppMessageDirection })
  direction: WhatsAppMessageDirection;

  @Column({ type: 'text', nullable: true })
  rawText: string | null;

  @Column('jsonb', { nullable: true })
  parsedPayload: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
