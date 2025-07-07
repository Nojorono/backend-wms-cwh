import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldBarcodeImageUrl1751851270494 implements MigrationInterface {
    name = 'AddFieldBarcodeImageUrl1751851270494'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "barcode_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "barcode_image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "barcode_image_url"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "barcode_image_url"`);
    }

}
