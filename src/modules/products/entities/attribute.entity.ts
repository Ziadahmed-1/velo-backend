import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { AttributeValue } from './attribute-value.entity';

// Kept for the merchant-facing "define your own attributes" admin UI.
// Read/filter performance comes from ProductVariant.attributesJson instead
// (see product-variant.entity.ts) — this table is the source of truth for
// which attributes/values exist, not what's queried at order time.
@Entity('attributes')
@Unique(['productId', 'name'])
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  name: string;

  @OneToMany(() => AttributeValue, (value) => value.attribute)
  values: AttributeValue[];
}
