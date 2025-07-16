import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldSourceInboundPlan1752629896962 implements MigrationInterface {
    name = 'AddFieldSourceInboundPlan1752629896962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_plan" ADD "source_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_plan" DROP COLUMN "source_id"`);
    }

}
