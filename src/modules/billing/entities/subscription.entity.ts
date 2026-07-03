import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SubscriptionStatus } from '../../../common/enums';
import { Account } from '../../accounts/entities/account.entity';
import { Plan } from './plan.entity';
import { UsagePeriod } from './usage-period.entity';
import { SubscriptionInvoice } from './subscription-invoice.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accountId: string;

  @OneToOne(() => Account, (account) => account.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  paymentProviderRef: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UsagePeriod, (usagePeriod) => usagePeriod.subscription)
  usagePeriods: UsagePeriod[];

  @OneToMany(() => SubscriptionInvoice, (invoice) => invoice.subscription)
  invoices: SubscriptionInvoice[];
}
