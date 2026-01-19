import { MigrationInterface, QueryRunner } from 'typeorm';

export class InboundSchemaChange1756973771354 implements MigrationInterface {
  name = 'InboundSchemaChange1756973771354';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_number"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "do_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_do_date" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_po_number" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_po_date" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_po_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_po_number"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_do_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "do_date" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_number" character varying`);
  }
}
