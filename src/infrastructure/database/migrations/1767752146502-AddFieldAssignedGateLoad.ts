import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldAssignedGateLoad1767752146502 implements MigrationInterface {
    name = 'AddFieldAssignedGateLoad1767752146502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD "week_number" integer`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD "production_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP COLUMN "production_date"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP COLUMN "week_number"`);
    }

}
