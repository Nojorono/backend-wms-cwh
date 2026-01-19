import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldwarehouseBin1759282443144 implements MigrationInterface {
  name = 'AddFieldwarehouseBin1759282443144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "current_pallet" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "current_pallet"`);
  }
}
