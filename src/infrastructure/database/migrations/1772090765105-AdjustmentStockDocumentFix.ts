import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustmentStockDocumentFix1772090765105 implements MigrationInterface {
    name = 'AdjustmentStockDocumentFix1772090765105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "document"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "document" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "document"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "document" character varying`);
    }

}
