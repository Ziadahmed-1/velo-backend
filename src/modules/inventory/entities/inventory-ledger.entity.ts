import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LedgerReason } from '../../../common/enums';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('inventory_ledger')
@Index(['variantId'])
@Index(['variantId', 'createdAt'])
export class InventoryLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  variantId: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.ledgerEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column('int')
  quantity: number;

  @Column({ type: 'enum', enum: LedgerReason })
  reason: LedgerReason;

  @Column({ nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, (order) => order.inventoryLedgerEntries, {
    nullable: true,
  })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @Column({ type: 'text', nullable: true })
  auditNote: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
