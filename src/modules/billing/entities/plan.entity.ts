import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BillingInterval } from '../../../common/enums';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('decimal', { precision: 12, scale: 2 })
  basePriceEgp: string;

  @Column('int')
  includedOrdersPerPeriod: number;

  @Column('decimal', { precision: 12, scale: 2 })
  overagePricePerOrderEgp: string;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Column('jsonb', { default: [] })
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
