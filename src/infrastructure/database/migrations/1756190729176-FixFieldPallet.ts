import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFieldPallet1756190729176 implements MigrationInterface {
    name = 'FixFieldPallet1756190729176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" RENAME COLUMN "uom_name" TO "barcode_image_url"`);
        await queryRunner.query(`CREATE TABLE "m_vehicle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_type" character varying NOT NULL, "vehicle_brand" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_acc5525e6e9442189fc46116605" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "barcode_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "barcode_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ALTER COLUMN "barcode_image_url" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" ALTER COLUMN "barcode_image_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "barcode_image_url"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "barcode_image_url"`);
        await queryRunner.query(`DROP TABLE "m_vehicle"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" RENAME COLUMN "barcode_image_url" TO "uom_name"`);
    }

}
