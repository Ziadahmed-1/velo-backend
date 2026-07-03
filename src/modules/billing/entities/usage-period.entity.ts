import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('usage_periods')
@Unique(['subscriptionId', 'periodStart'])
export class UsagePeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.usagePeriods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @Column('int', { default: 0 })
  orderCount: number;

  @Column('int', { default: 0 })
  overageOrders: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  overageAmountEgp: string;
}
