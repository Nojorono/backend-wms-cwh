import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldWeekScan1757996492835 implements MigrationInterface {
  name = 'AddFieldWeekScan1757996492835';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD "week_number" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP COLUMN "week_number"`);
  }
}
