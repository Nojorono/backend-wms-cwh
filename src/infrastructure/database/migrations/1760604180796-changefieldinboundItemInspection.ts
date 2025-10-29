import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangefieldinboundItemInspection1760604180796 implements MigrationInterface {
  name = 'ChangefieldinboundItemInspection1760604180796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "quantity_inspection"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "quantity_inspection" numeric(10,2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "quantity_inspection"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "quantity_inspection" integer`);
  }
}
