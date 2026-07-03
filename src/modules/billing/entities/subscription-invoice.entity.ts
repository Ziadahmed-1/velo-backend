import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionInvoiceStatus } from '../../../common/enums';
import { Subscription } from './subscription.entity';

@Entity('subscription_invoices')
export class SubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column('decimal', { precision: 12, scale: 2 })
  baseAmountEgp: string;

  @Column('decimal', { precision: 12, scale: 2 })
  overageAmountEgp: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmountEgp: string;

  @Column({ type: 'enum', enum: SubscriptionInvoiceStatus, default: SubscriptionInvoiceStatus.DRAFT })
  status: SubscriptionInvoiceStatus;

  @Column({ nullable: true })
  paymentProviderRef: string | null;

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;
}
