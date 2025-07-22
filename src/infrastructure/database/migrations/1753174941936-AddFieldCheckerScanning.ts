import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldCheckerScanning1753174941936 implements MigrationInterface {
    name = 'AddFieldCheckerScanning1753174941936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "inbound_delivery_order_item_id" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "item_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "item_id"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "inbound_delivery_order_item_id"`);
    }

}
