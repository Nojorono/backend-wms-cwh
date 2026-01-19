import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHelperAssignedGate1765982092948 implements MigrationInterface {
    name = 'AddHelperAssignedGate1765982092948'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assigned_gate_helper" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "assigned_gate_id" uuid, "helper_name" character varying, "helper_phone" character varying, CONSTRAINT "PK_6382582ed0ab8cc9a92753907ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_helper" ADD CONSTRAINT "FK_910b9570b90b424923efdf9290f" FOREIGN KEY ("assigned_gate_id") REFERENCES "assigned_gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_helper" DROP CONSTRAINT "FK_910b9570b90b424923efdf9290f"`);
        await queryRunner.query(`DROP TABLE "assigned_gate_helper"`);
    }

}
