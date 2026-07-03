import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Product } from './product.entity';
import { InventoryLedger } from '../../inventory/entities/inventory-ledger.entity';

@Entity('product_variants')
@Unique(['accountId', 'sku'])
@Index(['accountId'])
// Denormalized attribute values, e.g. {"Size":"XL","Color":"Black"}.
// GIN index makes "find variants where attributesJson @> {...}" fast
// instead of joining Attribute/AttributeValue at read time.
@Index('idx_product_variants_attributes_gin', { synchronize: false })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.productVariants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  sku: string;

  // Stored as string, not number — hand off to a decimal library
  // (e.g. decimal.js) for arithmetic. Never do money math with JS floats.
  @Column('decimal', { precision: 12, scale: 2 })
  price: string;

  @Column('decimal', { precision: 12, scale: 2 })
  costPrice: string;

  @Column('jsonb', { default: {} })
  attributesJson: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => InventoryLedger, (entry) => entry.variant)
  ledgerEntries: InventoryLedger[];
}

// NOTE: the GIN index above uses `synchronize: false` because TypeORM's
// migration generator doesn't reliably emit `USING GIN` for jsonb columns
// across all versions. Add it explicitly in a migration instead:
//
//   CREATE INDEX idx_product_variants_attributes_gin
//   ON product_variants USING GIN ("attributesJson");
