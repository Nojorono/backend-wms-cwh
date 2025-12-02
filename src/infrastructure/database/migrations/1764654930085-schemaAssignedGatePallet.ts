import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaAssignedGatePallet1764654930085 implements MigrationInterface {
    name = 'SchemaAssignedGatePallet1764654930085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assigned_gate_pallet_status_enum" AS ENUM('ASSIGNED', 'COMPLETED', 'CANCELLED', 'RETURNED')`);
        await queryRunner.query(`CREATE TABLE "assigned_gate_pallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "assigned_gate_id" uuid, "pallet_id" uuid, "status" "public"."assigned_gate_pallet_status_enum" NOT NULL DEFAULT 'ASSIGNED', CONSTRAINT "PK_5de1acd912b8c3fc9124c7014b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" ADD CONSTRAINT "FK_2a288152343347b49364e8f7cda" FOREIGN KEY ("assigned_gate_id") REFERENCES "assigned_gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" ADD CONSTRAINT "FK_bd1195e6aaa954114787316269b" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" DROP CONSTRAINT "FK_bd1195e6aaa954114787316269b"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_pallet" DROP CONSTRAINT "FK_2a288152343347b49364e8f7cda"`);
        await queryRunner.query(`DROP TABLE "assigned_gate_pallet"`);
        await queryRunner.query(`DROP TYPE "public"."assigned_gate_pallet_status_enum"`);
    }

}
