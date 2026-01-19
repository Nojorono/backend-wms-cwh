import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeSchemaPallet1757383668502 implements MigrationInterface {
  name = 'ChangeSchemaPallet1757383668502';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "barcode_image_url"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" ADD "qr_image_url" character varying`);
    await queryRunner.query(`ALTER TABLE "m_pallet" ADD "uom" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_id" uuid`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_do_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_do_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_po_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_po_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "arrival_date"`);
    await queryRunner.query(`ALTER TABLE "inbound" ADD "arrival_date" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "inbound_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "inbound_id" uuid`);
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "inbound_do_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "inbound_do_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "inbound_do" ADD CONSTRAINT "FK_2f26a8c1474ad1e6b67fc2cc943" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_item" ADD CONSTRAINT "FK_50fd3d2e7a52a74f6198b6b7d29" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_item" ADD CONSTRAINT "FK_2c03326bdc868775b9ad272aab1" FOREIGN KEY ("inbound_do_id") REFERENCES "inbound_do"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inbound_item" DROP CONSTRAINT "FK_2c03326bdc868775b9ad272aab1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_item" DROP CONSTRAINT "FK_50fd3d2e7a52a74f6198b6b7d29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_do" DROP CONSTRAINT "FK_2f26a8c1474ad1e6b67fc2cc943"`,
    );
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "inbound_do_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "inbound_do_id" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "inbound_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_item" ADD "inbound_id" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "arrival_date"`);
    await queryRunner.query(`ALTER TABLE "inbound" ADD "arrival_date" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_po_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_po_date" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_do_date"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_do_date" character varying`);
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "inbound_id"`);
    await queryRunner.query(`ALTER TABLE "inbound_do" ADD "inbound_id" character varying`);
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "uom"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "qr_image_url"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" ADD "barcode_image_url" character varying`);
  }
}
