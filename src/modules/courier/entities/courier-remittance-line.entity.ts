import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CourierRemittance } from './courier-remittance.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('courier_remittance_lines')
@Unique(['remittanceId', 'orderId'])
export class CourierRemittanceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  remittanceId: string;

  @ManyToOne(() => CourierRemittance, (remittance) => remittance.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'remittanceId' })
  remittance: CourierRemittance;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.remittanceLines)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('decimal', { precision: 12, scale: 2 })
  expectedAmount: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  receivedAmount: string;
}
