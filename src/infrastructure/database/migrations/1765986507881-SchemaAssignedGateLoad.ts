import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaAssignedGateLoad1765986507881 implements MigrationInterface {
    name = 'SchemaAssignedGateLoad1765986507881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assigned_gate_load" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "assigned_gate_id" uuid, "outbound_do_id" uuid, "outbound_memo_id" uuid, "pallet_id" uuid, "item_id" uuid, "uom" character varying, "quantity_picked" integer, "quantity_loaded" integer, "quantity_unloaded" integer, "status" character varying, CONSTRAINT "PK_208da3ce029a1c16589589c63bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD CONSTRAINT "FK_ec61e24fec193ca8df7cac83a2c" FOREIGN KEY ("assigned_gate_id") REFERENCES "assigned_gate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD CONSTRAINT "FK_79ceeeb5df121a829243ab9ab85" FOREIGN KEY ("outbound_do_id") REFERENCES "outbound_do"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD CONSTRAINT "FK_38d671f1797edaa2acccd38987b" FOREIGN KEY ("outbound_memo_id") REFERENCES "outbound_memo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD CONSTRAINT "FK_2662a40ad5e4aeb3378c78bb879" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ADD CONSTRAINT "FK_3f4e12ee097dc2b3f27487a3bb3" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP CONSTRAINT "FK_3f4e12ee097dc2b3f27487a3bb3"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP CONSTRAINT "FK_2662a40ad5e4aeb3378c78bb879"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP CONSTRAINT "FK_38d671f1797edaa2acccd38987b"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP CONSTRAINT "FK_79ceeeb5df121a829243ab9ab85"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" DROP CONSTRAINT "FK_ec61e24fec193ca8df7cac83a2c"`);
        await queryRunner.query(`DROP TABLE "assigned_gate_load"`);
    }

}
