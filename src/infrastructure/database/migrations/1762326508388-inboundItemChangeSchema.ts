import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundItemChangeSchema1762326508388 implements MigrationInterface {
    name = 'InboundItemChangeSchema1762326508388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "uom_inspection" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "uom_inspection"`);
    }

}
