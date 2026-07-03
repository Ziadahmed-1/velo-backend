import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AccountStatus } from '../../../common/enums';
import { User } from './user.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { CourierRemittance } from '../../courier/entities/courier-remittance.entity';
import { Subscription } from '../../billing/entities/subscription.entity';
import { WhatsAppAccount } from '../../whatsapp/entities/whatsapp-account.entity';

// One Account = one store = one subscription (kept deliberately simple;
// see ARCHITECTURE.md for the multi-store migration path if that changes).
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.TRIALING })
  status: AccountStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.account)
  users: User[];

  @OneToMany(() => Product, (product) => product.account)
  products: Product[];

  @OneToMany(() => ProductVariant, (variant) => variant.account)
  productVariants: ProductVariant[];

  @OneToMany(() => Customer, (customer) => customer.account)
  customers: Customer[];

  @OneToMany(() => Order, (order) => order.account)
  orders: Order[];

  @OneToMany(() => CourierRemittance, (remittance) => remittance.account)
  courierRemittances: CourierRemittance[];

  @OneToOne(() => Subscription, (subscription) => subscription.account)
  subscription: Subscription;

  @OneToOne(() => WhatsAppAccount, (whatsAppAccount) => whatsAppAccount.account)
  whatsAppAccount: WhatsAppAccount;
}
