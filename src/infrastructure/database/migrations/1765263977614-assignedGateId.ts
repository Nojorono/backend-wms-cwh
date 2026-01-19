import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignedGateId1765263977614 implements MigrationInterface {
    name = 'AssignedGateId1765263977614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate" RENAME COLUMN "gate_name" TO "gate_id"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" DROP COLUMN "gate_id"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ADD "gate_id" uuid`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ADD CONSTRAINT "FK_c6cc64bf57cd616dc2b9418f49f" FOREIGN KEY ("gate_id") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate" DROP CONSTRAINT "FK_c6cc64bf57cd616dc2b9418f49f"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" DROP COLUMN "gate_id"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ADD "gate_id" character varying`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" RENAME COLUMN "gate_id" TO "gate_name"`);
    }

}
