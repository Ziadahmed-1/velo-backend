import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('courier_remittances')
export class CourierRemittance {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @ManyToOne(() => Account, (account) => account.courierRemittances) account: Account;
}
