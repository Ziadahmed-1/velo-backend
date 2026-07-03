import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { MatchStatus } from '../../../common/enums';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.orderItems, {
    nullable: true,
  })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  price: string;

  @Column('int', { nullable: true })
  matchConfidence: number | null;

  @Column({ type: 'varchar', nullable: true })
  matchStatus: MatchStatus | null;

  @Column({ type: 'text', nullable: true })
  extractedRawName: string | null;

  @Column('jsonb', { nullable: true })
  suggestedAlternatives: object | null;
}
