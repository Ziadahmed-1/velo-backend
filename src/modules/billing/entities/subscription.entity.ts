import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @OneToOne(() => Account, (account) => account.subscription) account: Account;
}
