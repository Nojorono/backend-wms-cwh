import { MigrationInterface, QueryRunner } from 'typeorm';

export class BtbDetailsItemMeta1789535413000 implements MigrationInterface {
  name = 'BtbDetailsItemMeta1789535413000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ADD COLUMN IF NOT EXISTS "item_number" character varying(100)
    `);
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ADD COLUMN IF NOT EXISTS "type" character varying(50) DEFAULT 'GS'
    `);
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ALTER COLUMN "type" SET DEFAULT 'GS'
    `);
    await queryRunner.query(`
      UPDATE "btb_details"
      SET "type" = 'GS'
      WHERE "type" IS NULL OR TRIM("type") = ''
    `);
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ADD COLUMN IF NOT EXISTS "year" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ADD COLUMN IF NOT EXISTS "bandrol_price" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ADD COLUMN IF NOT EXISTS "bs_price" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "btb_details" DROP COLUMN IF EXISTS "bs_price"`);
    await queryRunner.query(`ALTER TABLE "btb_details" DROP COLUMN IF EXISTS "bandrol_price"`);
    await queryRunner.query(`ALTER TABLE "btb_details" DROP COLUMN IF EXISTS "year"`);
    await queryRunner.query(`ALTER TABLE "btb_details" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`ALTER TABLE "btb_details" DROP COLUMN IF EXISTS "item_number"`);
  }
}
