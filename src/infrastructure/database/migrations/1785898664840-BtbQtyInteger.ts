import { MigrationInterface, QueryRunner } from 'typeorm';

export class BtbQtyInteger1785898664840 implements MigrationInterface {
  name = 'BtbQtyInteger1785898664840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ALTER COLUMN "btb_qty" TYPE integer
      USING ROUND("btb_qty")::integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "btb_details"
      ALTER COLUMN "btb_qty" TYPE numeric(18,4)
      USING "btb_qty"::numeric(18,4)
    `);
  }
}
