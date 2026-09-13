import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldinboundIntegration1776769261448 implements MigrationInterface {
    name = 'AddFieldinboundIntegration1776769261448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD CONSTRAINT "FK_1e1729dd7bd643c37264f00f270" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP CONSTRAINT "FK_1e1729dd7bd643c37264f00f270"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP COLUMN "organization_id"`);
    }

}
