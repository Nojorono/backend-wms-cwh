import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldinboundIntegration1776784084138 implements MigrationInterface {
    name = 'ChangeFieldinboundIntegration1776784084138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "quantity" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "quantity" numeric(18,6)`);
    }

}
