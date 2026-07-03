import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { WhatsAppConversationStatus } from '../../../common/enums';
import { WhatsAppAccount } from './whatsapp-account.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { WhatsAppMessage } from './whatsapp-message.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('whatsapp_conversations')
@Index(['whatsAppAccountId', 'customerPhone'])
export class WhatsAppConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  whatsAppAccountId: string;

  @ManyToOne(() => WhatsAppAccount, (account) => account.conversations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'whatsAppAccountId' })
  whatsAppAccount: WhatsAppAccount;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, (customer) => customer.conversations, {
    nullable: true,
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @Column({
    type: 'enum',
    enum: WhatsAppConversationStatus,
    default: WhatsAppConversationStatus.OPEN,
  })
  status: WhatsAppConversationStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WhatsAppMessage, (message) => message.conversation)
  messages: WhatsAppMessage[];

  @OneToMany(() => Order, (order) => order.waConversation)
  orders: Order[];
}
