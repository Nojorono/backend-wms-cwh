import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSchemaInboundScanAndSubWarehouse1758074757546 implements MigrationInterface {
  name = 'FixSchemaInboundScanAndSubWarehouse1758074757546';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "is_staging" character varying`);
    await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD "m_warehouse_sub_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transaction_scan_inbound" ADD CONSTRAINT "FK_876b685590378e612159ce59ab7" FOREIGN KEY ("m_warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_scan_inbound" DROP CONSTRAINT "FK_876b685590378e612159ce59ab7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_scan_inbound" DROP COLUMN "m_warehouse_sub_id"`,
    );
    await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "is_staging"`);
  }
}
