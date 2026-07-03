### Task 8: Migrations + Final Wiring

**Files:**

- Create: `src/jobs/.gitkeep`
- Run: TypeORM migration generation
- Create: hand-written pg_trgm + GIN index migrations
- Update: `tsconfig.json`

- [ ] **Step 1: Create jobs placeholder**

```bash
mkdir -p src/jobs
New-Item src/jobs/.gitkeep -ItemType File
```

- [ ] **Step 2: Configure TypeORM data source**

Create `src/database/data-source.ts`:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
```

- [ ] **Step 3: Add TypeORM scripts to package.json**

```json
"typeorm": "typeorm-ts-node-commonjs",
"migration:generate": "typeorm migration:generate -d src/database/data-source.ts",
"migration:run": "typeorm migration:run -d src/database/data-source.ts"
```

- [ ] **Step 4: Create custom migrations**

`src/database/migrations/1700000000000-SetupPgTrgm.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
export class SetupPgTrgm1700000000000 implements MigrationInterface {
  name = 'SetupPgTrgm1700000000000';
  async up(qr: QueryRunner): Promise<void> {
    await qr.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  }
  async down(qr: QueryRunner): Promise<void> {}
}
```

`src/database/migrations/1700000000001-AddGinIndexOnVariantAttributes.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddGinIndexOnVariantAttributes1700000000001 implements MigrationInterface {
  name = 'AddGinIndexOnVariantAttributes1700000000001';
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      'CREATE INDEX IF NOT EXISTS idx_product_variants_attributes_gin ON product_variants USING GIN ("attributesJson")',
    );
  }
  async down(qr: QueryRunner): Promise<void> {
    await qr.query('DROP INDEX IF EXISTS idx_product_variants_attributes_gin');
  }
}
```

- [ ] **Step 5: Run final build**

```bash
npx nest build
```

- [ ] **Step 6: Full test suite**

```bash
npx jest --passWithNoTests --verbose
```

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: add migrations, wire up remaining modules, finalize Phase Alpha"
git tag phase-alpha-complete
```

---

## Self-Review

- [ ] **Spec coverage:** Docker, NestJS scaffold, all 21 entities, auth/JWT, 3 guards, inventory ledger, CRUD for products/customers/orders, migrations.
- [ ] **Placeholder scan:** No TBDs, TODOs, or "implement later" gaps.
- [ ] **Type consistency:** All method signatures, DTOs, and entity references match across tasks.
- [ ] **Scope check:** Phase Alpha only — no LLM, courier, WhatsApp, or billing logic.
