import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @ManyToOne(() => Account, (account) => account.customers) account: Account;
  @Column() phone: string;
  @Column() name: string;
}
