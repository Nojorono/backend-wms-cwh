import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInbound1776305624390 implements MigrationInterface {
    name = 'AddFieldInbound1776305624390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound" ADD CONSTRAINT "FK_80cf9fec910ca85582f31118987" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" DROP CONSTRAINT "FK_80cf9fec910ca85582f31118987"`);
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "organization_id"`);
    }

}
