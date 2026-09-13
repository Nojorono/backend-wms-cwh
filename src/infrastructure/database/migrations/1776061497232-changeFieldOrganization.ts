import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldOrganization1776061497232 implements MigrationInterface {
    name = 'ChangeFieldOrganization1776061497232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD CONSTRAINT "FK_a2df6add5f5d3f12b2586d88b9a" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP CONSTRAINT "FK_a2df6add5f5d3f12b2586d88b9a"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "organization_id" integer`);
    }

}
