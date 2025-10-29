import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldInventoryTracking1759988046916 implements MigrationInterface {
  name = 'AddFieldInventoryTracking1759988046916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" ADD "progression_status" character varying DEFAULT 'NOT_STARTED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_tracking" DROP COLUMN "progression_status"`);
  }
}
