import { MigrationInterface, QueryRunner } from "typeorm";

export class InspectionBy1761620887977 implements MigrationInterface {
    name = 'InspectionBy1761620887977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD "inspection_by" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP COLUMN "inspection_by"`);
    }

}
