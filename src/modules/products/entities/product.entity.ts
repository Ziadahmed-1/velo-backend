import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Attribute } from './attribute.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
@Index(['accountId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Attribute, (attribute) => attribute.product)
  attributes: Attribute[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];
}
