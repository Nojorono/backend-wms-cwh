import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldLocatorWarehouse1776319751198 implements MigrationInterface {
    name = 'AddFieldLocatorWarehouse1776319751198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "barcode_image_url"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "barcode_image_url"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" ADD "locator_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" ADD "locator_name" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "locator_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "locator_name" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "locator_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "locator_name" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" ADD CONSTRAINT "FK_b5a10c9c07ffa35f1a1cce859a0" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse" DROP CONSTRAINT "FK_b5a10c9c07ffa35f1a1cce859a0"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" ADD "organization_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "locator_name"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "locator_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "locator_name"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "locator_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" DROP COLUMN "locator_name"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse" DROP COLUMN "locator_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "organization_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "barcode_image_url" character varying`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "organization_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "barcode_image_url" character varying`);
    }

}
