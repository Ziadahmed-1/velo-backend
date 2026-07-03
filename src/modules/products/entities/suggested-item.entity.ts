import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

@Entity('suggested_items')
export class SuggestedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  rawName: string;

  @Column('int', { default: 1 })
  timesMentioned: number;

  @Column({ default: false })
  isDismissed: boolean;

  @Column({ nullable: true })
  linkedVariantId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
