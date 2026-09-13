import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundReturInventory1770365234641 implements MigrationInterface {
    name = 'InboundReturInventory1770365234641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD "production_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP COLUMN "production_date"`);
    }

}
