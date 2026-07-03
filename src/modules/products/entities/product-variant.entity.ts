import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() accountId: string;
  @ManyToOne(() => Account, (account) => account.productVariants) account: Account;
  @Column() productId: string;
  @Column() sku: string;
}
