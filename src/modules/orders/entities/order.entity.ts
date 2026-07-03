import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import {
  OrderStatus,
  CodStatus,
  OrderSourceChannel,
} from '../../../common/enums';
import { Account } from '../../accounts/entities/account.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { Invoice } from './invoice.entity';
import { InventoryLedger } from '../../inventory/entities/inventory-ledger.entity';
import { WhatsAppConversation } from '../../whatsapp/entities/whatsapp-conversation.entity';
import { CourierRemittanceLine } from '../../courier/entities/courier-remittance-line.entity';

@Entity('orders')
@Index(['accountId', 'status', 'createdAt'])
@Index(['customerId'])
@Index(['accountId', 'codStatus'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: CodStatus,
    default: CodStatus.PENDING_COLLECTION,
  })
  codStatus: CodStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  subTotal: string;

  @Column('decimal', { precision: 12, scale: 2 })
  shippingFee: string;

  @Column('decimal', { precision: 12, scale: 2 })
  vatAmount: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: string;

  @Column({ nullable: true })
  courierTracking: string | null;

  @Column({ nullable: true })
  courierProvider: string | null;

  @Column({ nullable: true })
  waConversationId: string | null;

  @Column({
    type: 'enum',
    enum: OrderSourceChannel,
    default: OrderSourceChannel.MANUAL,
  })
  sourceChannel: OrderSourceChannel;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  orderItems: OrderItem[];

  @OneToOne(() => Invoice, (invoice) => invoice.order)
  invoice: Invoice;

  @OneToMany(() => InventoryLedger, (entry) => entry.order)
  inventoryLedgerEntries: InventoryLedger[];

  @ManyToOne(
    () => WhatsAppConversation,
    (conversation) => conversation.orders,
    { nullable: true },
  )
  @JoinColumn({ name: 'waConversationId' })
  waConversation: WhatsAppConversation;

  @OneToMany(() => CourierRemittanceLine, (line) => line.order)
  remittanceLines: CourierRemittanceLine[];
}
