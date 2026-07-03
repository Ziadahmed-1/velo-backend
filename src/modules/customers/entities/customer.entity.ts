import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Order } from '../../orders/entities/order.entity';
import { WhatsAppConversation } from '../../whatsapp/entities/whatsapp-conversation.entity';

@Entity('customers')
@Unique(['accountId', 'phone'])
@Index(['accountId'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  phone: string;

  @Column()
  name: string;

  @Column()
  governorate: string;

  @Column()
  district: string;

  @Column()
  streetAddress: string;

  @Column({ nullable: true })
  landmark: string | null;

  @Column('int', { nullable: true })
  rfmRecencyDays: number | null;

  @Column('int', { nullable: true })
  rfmFrequency: number | null;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  rfmMonetary: string | null;

  @Column('int', { default: 0 })
  rtoOrderCount: number;

  @Column('int', { default: 0 })
  deliveredCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => WhatsAppConversation, (conversation) => conversation.customer)
  conversations: WhatsAppConversation[];
}
