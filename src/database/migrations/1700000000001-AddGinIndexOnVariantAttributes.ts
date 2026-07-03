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
