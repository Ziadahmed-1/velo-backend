import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RemittanceStatus } from '../../../common/enums';
import { Account } from '../../accounts/entities/account.entity';
import { CourierRemittanceLine } from './courier-remittance-line.entity';

@Entity('courier_remittances')
@Index(['accountId', 'status'])
export class CourierRemittance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.courierRemittances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  courierProvider: string;

  @Column('decimal', { precision: 12, scale: 2 })
  expectedAmount: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  receivedAmount: string;

  @Column({
    type: 'enum',
    enum: RemittanceStatus,
    default: RemittanceStatus.PENDING,
  })
  status: RemittanceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  remittedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CourierRemittanceLine, (line) => line.remittance)
  lines: CourierRemittanceLine[];
}
