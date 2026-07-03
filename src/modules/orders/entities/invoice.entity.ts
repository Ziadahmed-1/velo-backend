import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @OneToOne(() => Order, (order) => order.invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'text', nullable: true })
  xmlArchive: string | null;

  @Column({ nullable: true })
  etaUuid: string | null;

  @Column({ nullable: true })
  etaSubmissionStatus: string | null;

  @CreateDateColumn()
  issuedAt: Date;
}
