import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @ManyToOne(() => Account, (account) => account.orders) account: Account;
  @Column() customerId: string;
}
