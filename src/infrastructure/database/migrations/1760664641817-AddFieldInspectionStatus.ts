import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInspectionStatus1760664641817 implements MigrationInterface {
    name = 'AddFieldInspectionStatus1760664641817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "inspection_status" character varying DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "inspection_status"`);
    }

}
