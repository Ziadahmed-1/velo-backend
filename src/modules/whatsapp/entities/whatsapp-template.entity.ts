import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { WhatsAppAccount } from './whatsapp-account.entity';

@Entity('whatsapp_templates')
@Unique(['whatsAppAccountId', 'name'])
export class WhatsAppTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  whatsAppAccountId: string;

  @ManyToOne(() => WhatsAppAccount, (account) => account.templates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'whatsAppAccountId' })
  whatsAppAccount: WhatsAppAccount;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ default: 'PENDING' })
  approvalStatus: string;
}
