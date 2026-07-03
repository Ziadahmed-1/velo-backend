# Task 1: Add New Entity Fields + SuggestedItem Entity

**Files:**
- Modify: `src/modules/orders/entities/order.entity.ts`
- Modify: `src/modules/orders/entities/order-item.entity.ts`
- Create: `src/modules/products/entities/suggested-item.entity.ts`
- Modify: `src/common/enums.ts`
- Modify: `src/modules/products/products.module.ts`
- Create: `src/database/migrations/1700000000002-AddOrderDraftFields.ts`
- Create: `src/database/migrations/1700000000003-CreateSuggestedItems.ts`

**New enum in `src/common/enums.ts`**
Add after existing enums:
```typescript
export enum MatchStatus {
  HIGH_CONFIDENCE = 'HIGH_CONFIDENCE',
  AMBIGUOUS = 'AMBIGUOUS',
  NO_MATCH = 'NO_MATCH',
}
```

**Order entity changes (src/modules/orders/entities/order.entity.ts)**
Add these columns to the existing Order entity:
- `isDraft: boolean` — `@Column({ default: true })`
- `conversationContext: object | null` — `@Column('jsonb', { nullable: true })`

**OrderItem entity changes (src/modules/orders/entities/order-item.entity.ts)**
Add these columns to the existing OrderItem entity:
- `matchConfidence: number | null` — `@Column('int', { nullable: true })`
- `matchStatus: string | null` — `@Column({ type: 'varchar', nullable: true })`
- `extractedRawName: string | null` — `@Column({ type: 'text', nullable: true })`
- `suggestedAlternatives: object | null` — `@Column('jsonb', { nullable: true })`

**SuggestedItem entity (new file: src/modules/products/entities/suggested-item.entity.ts)**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

@Entity('suggested_items')
export class SuggestedItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  rawName: string;

  @Column('int', { default: 1 })
  timesMentioned: number;

  @Column({ default: false })
  isDismissed: boolean;

  @Column({ nullable: true })
  linkedVariantId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Register in ProductsModule (src/modules/products/products.module.ts)**
Add `SuggestedItem` to the TypeOrmModule.forFeature array:
```typescript
TypeOrmModule.forFeature([Product, ProductVariant, Attribute, AttributeValue, SuggestedItem])
```

**Migration 1700000000002-AddOrderDraftFields.ts**
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderDraftFields1700000000002 implements MigrationInterface {
  name = 'AddOrderDraftFields1700000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "isDraft" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "conversationContext" jsonb`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "matchConfidence" integer`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "matchStatus" varchar`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "extractedRawName" text`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "suggestedAlternatives" jsonb`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "suggestedAlternatives"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "extractedRawName"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "matchStatus"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "matchConfidence"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "conversationContext"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "isDraft"`);
  }
}
```

**Migration 1700000000003-CreateSuggestedItems.ts**
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuggestedItems1700000000003 implements MigrationInterface {
  name = 'CreateSuggestedItems1700000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suggested_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "accountId" character varying NOT NULL,
        "rawName" character varying NOT NULL,
        "timesMentioned" integer NOT NULL DEFAULT '1',
        "isDismissed" boolean NOT NULL DEFAULT false,
        "linkedVariantId" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suggested_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "suggested_items"
      ADD CONSTRAINT "FK_suggested_items_account"
      FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "suggested_items" DROP CONSTRAINT "FK_suggested_items_account"`);
    await queryRunner.query(`DROP TABLE "suggested_items"`);
  }
}
```

**Testing:**
- Run `npx eslint --ext .ts src/` — 0 errors
- Run `npx jest --passWithNoTests` — existing tests still pass

**Commit:**
```bash
git add src/common/enums.ts src/modules/orders/entities/order.entity.ts src/modules/orders/entities/order-item.entity.ts src/modules/products/entities/suggested-item.entity.ts src/modules/products/products.module.ts src/database/migrations/
git commit -m "feat: add draft order fields, SuggestedItem entity, MatchStatus enum"
```
