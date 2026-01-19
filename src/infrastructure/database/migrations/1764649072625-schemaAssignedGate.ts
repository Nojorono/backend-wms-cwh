import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaAssignedGate1764649072625 implements MigrationInterface {
    name = 'SchemaAssignedGate1764649072625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assigned_gate_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "assigned_gate_id" uuid, "user_id" uuid, "user_name" character varying, "user_phone" character varying, CONSTRAINT "PK_3ba77cc4ca3ac6f59b979115704" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assigned_gate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "gate_name" character varying, "outbound_do_id" uuid, CONSTRAINT "PK_7f3546c4db075490ef086aeb95b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_user" ADD CONSTRAINT "FK_93bb33f7a6efc0a3ca5fa614743" FOREIGN KEY ("assigned_gate_id") REFERENCES "assigned_gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_user" ADD CONSTRAINT "FK_871b3a3efc35e7106bf66588178" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ADD CONSTRAINT "FK_7b0f88cc73c7f7fca6f821efa59" FOREIGN KEY ("outbound_do_id") REFERENCES "outbound_do"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate" DROP CONSTRAINT "FK_7b0f88cc73c7f7fca6f821efa59"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_user" DROP CONSTRAINT "FK_871b3a3efc35e7106bf66588178"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_user" DROP CONSTRAINT "FK_93bb33f7a6efc0a3ca5fa614743"`);
        await queryRunner.query(`DROP TABLE "assigned_gate"`);
        await queryRunner.query(`DROP TABLE "assigned_gate_user"`);
    }

}
