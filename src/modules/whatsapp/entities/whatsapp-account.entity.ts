import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('whatsapp_accounts')
export class WhatsAppAccount {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @OneToOne(() => Account, (account) => account.whatsAppAccount) account: Account;
}
