import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoSuggestionDetailQtyInteger1781775000000 implements MigrationInterface {
  name = 'DoSuggestionDetailQtyInteger1781775000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_suggestion" TYPE bigint
      USING ROUND("item_qty_suggestion")::bigint
    `);
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_revision" TYPE bigint
      USING ROUND("item_qty_revision")::bigint
    `);
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_final" TYPE bigint
      USING ROUND("item_qty_final")::bigint
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_suggestion" TYPE numeric(18,4)
      USING "item_qty_suggestion"::numeric(18,4)
    `);
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_revision" TYPE numeric(18,4)
      USING "item_qty_revision"::numeric(18,4)
    `);
    await queryRunner.query(`
      ALTER TABLE "do_suggestion_details"
      ALTER COLUMN "item_qty_final" TYPE numeric(18,4)
      USING "item_qty_final"::numeric(18,4)
    `);
  }
}
