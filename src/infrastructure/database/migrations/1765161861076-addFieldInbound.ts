import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInbound1765161861076 implements MigrationInterface {
    name = 'AddFieldInbound1765161861076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" ADD "photo_license_plate" character varying`);
        await queryRunner.query(`ALTER TABLE "inbound" ADD "photo_seal" character varying`);
        await queryRunner.query(`ALTER TABLE "inbound" ADD "photo_condition" character varying`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" ALTER COLUMN "status" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" ALTER COLUMN "status" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "photo_condition"`);
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "photo_seal"`);
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "photo_license_plate"`);
    }

}
