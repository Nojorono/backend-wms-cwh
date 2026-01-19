import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusschemaAssignedGate1764653874487 implements MigrationInterface {
    name = 'AddStatusschemaAssignedGate1764653874487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assigned_gate_status_enum" AS ENUM('PENDING', 'DONE')`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ADD "status" "public"."assigned_gate_status_enum" DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."assigned_gate_status_enum"`);
    }

}
