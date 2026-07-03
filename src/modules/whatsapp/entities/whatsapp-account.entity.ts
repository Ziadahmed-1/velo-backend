import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { WhatsAppTemplate } from './whatsapp-template.entity';
import { WhatsAppConversation } from './whatsapp-conversation.entity';

@Entity('whatsapp_accounts')
export class WhatsAppAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accountId: string;

  @OneToOne(() => Account, (account) => account.whatsAppAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  bspProvider: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  bspChannelId: string;

  @Column()
  accessTokenRef: string;

  @Column({ default: 'PENDING_VERIFICATION' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WhatsAppTemplate, (template) => template.whatsAppAccount)
  templates: WhatsAppTemplate[];

  @OneToMany(() => WhatsAppConversation, (conversation) => conversation.whatsAppAccount)
  conversations: WhatsAppConversation[];
}
