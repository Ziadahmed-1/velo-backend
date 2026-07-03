import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultPlans1700000000004 implements MigrationInterface {
  name = 'SeedDefaultPlans1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO plans (id, name, "basePriceEgp", "includedOrdersPerPeriod", "overagePricePerOrderEgp", "billingInterval", features, "isActive")
      VALUES
        (uuid_generate_v4(), 'Trial', '0', 50, '5.00', 'MONTHLY', '[]'::jsonb, true),
        (uuid_generate_v4(), 'Starter', '999', 250, '4.00', 'MONTHLY', '[]'::jsonb, true),
        (uuid_generate_v4(), 'Pro', '2499', 1000, '3.00', 'MONTHLY', '[]'::jsonb, true)
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM plans WHERE name IN ('Trial', 'Starter', 'Pro')`,
    );
  }
}
