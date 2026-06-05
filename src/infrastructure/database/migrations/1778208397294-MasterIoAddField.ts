import { MigrationInterface, QueryRunner } from "typeorm";

export class MasterIoAddField1778208397294 implements MigrationInterface {
    name = 'MasterIoAddField1778208397294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "operating_unit"`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "organization_code" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "org_name" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "org_id" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "organization_type" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "region_code" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "location_id" bigint`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "start_date_active" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "end_date_active" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "organization_id" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "organization_id" integer`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "end_date_active"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "start_date_active"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "location_id"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "region_code"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "organization_type"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "org_id"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "org_name"`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "organization_code"`);
        await queryRunner.query(`ALTER TABLE "m_io" ADD "operating_unit" character varying`);
    }

}
