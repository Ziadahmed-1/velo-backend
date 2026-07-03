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
    await queryRunner.query(
      `ALTER TABLE "suggested_items" DROP CONSTRAINT "FK_suggested_items_account"`,
    );
    await queryRunner.query(`DROP TABLE "suggested_items"`);
  }
}
