import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetupPgTrgm1700000000000 implements MigrationInterface {
  name = 'SetupPgTrgm1700000000000';

  async up(qr: QueryRunner): Promise<void> {
    await qr.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  }

  async down(qr: QueryRunner): Promise<void> {}
}
