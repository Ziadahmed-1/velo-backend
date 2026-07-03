import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { InventoryLedger } from '../../inventory/entities/inventory-ledger.entity';
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @ManyToOne(() => Account, (account) => account.orders) account: Account;
  @Column() customerId: string;

  @OneToMany(() => InventoryLedger, (entry) => entry.order)
  inventoryLedgerEntries: InventoryLedger[];
}
