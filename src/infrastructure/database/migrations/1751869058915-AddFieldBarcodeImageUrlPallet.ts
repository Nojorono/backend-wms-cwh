import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldBarcodeImageUrlPallet1751869058915 implements MigrationInterface {
    name = 'AddFieldBarcodeImageUrlPallet1751869058915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "barcode_image_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "barcode_image_url"`);
    }

}
