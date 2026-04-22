import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexFieldinboundIntegration1776819885911 implements MigrationInterface {
    name = 'IndexFieldinboundIntegration1776819885911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_inbound_integration_inbound_do_id" ON "inbound_integration" ("inbound_do_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_inbound_integration_inbound_do_id"`);
    }

}
