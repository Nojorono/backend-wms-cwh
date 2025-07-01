import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldCheckerScan1751349187349 implements MigrationInterface {
    name = 'ChangeFieldCheckerScan1751349187349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "scanning_date"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "inbound_transporter_id" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "organization_id" integer`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "inbound_plan_id" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "updated_by" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "created_by" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "inbound_plan_id"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "inbound_transporter_id"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "scanning_date" TIMESTAMP`);
    }

}
