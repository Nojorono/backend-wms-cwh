import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldSourceCheckerScan1752630813496 implements MigrationInterface {
    name = 'AddFieldSourceCheckerScan1752630813496'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "status" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "approved_by" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "approved_by"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "status"`);
    }

}
