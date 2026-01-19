import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldUpdateSaldo1758511543851 implements MigrationInterface {
  name = 'AddFieldUpdateSaldo1758511543851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "quantity_inspection" integer`);
    await queryRunner.query(
      `ALTER TABLE "inbound_do" ADD "integration_status" character varying DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "integration_status"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "quantity_inspection"`);
  }
}
