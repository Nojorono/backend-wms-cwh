import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldNumberQty1751963667052 implements MigrationInterface {
    name = 'ChangeFieldNumberQty1751963667052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "inbound_delivery_order_id" character varying`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" DROP COLUMN "qty_plan"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" ADD "qty_plan" integer`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "actual_qty"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "actual_qty" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "actual_qty"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "actual_qty" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" DROP COLUMN "qty_plan"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" ADD "qty_plan" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "inbound_delivery_order_id"`);
    }

}
