import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderDraftFields1700000000002 implements MigrationInterface {
  name = 'AddOrderDraftFields1700000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "isDraft" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "conversationContext" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "matchConfidence" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "matchStatus" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "extractedRawName" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "suggestedAlternatives" jsonb`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "suggestedAlternatives"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "extractedRawName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "matchStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "matchConfidence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "conversationContext"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "isDraft"`);
  }
}
