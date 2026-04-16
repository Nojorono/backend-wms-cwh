import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInboundDo1776305009309 implements MigrationInterface {
    name = 'AddFieldInboundDo1776305009309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "line_number" integer`);
        await queryRunner.query(`ALTER TABLE "inbound_do" ADD "vendor_id" integer`);
        await queryRunner.query(`ALTER TABLE "inbound_do" ADD "vendor_site_id" integer`);
        await queryRunner.query(`ALTER TABLE "inbound_do" ADD "total_line_items" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "total_line_items"`);
        await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "vendor_site_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "vendor_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "line_number"`);
    }

}
