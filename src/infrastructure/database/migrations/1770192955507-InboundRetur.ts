import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundRetur1770192955507 implements MigrationInterface {
    name = 'InboundRetur1770192955507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_tracking_bad" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_retur_id" uuid, "item_id" uuid, "quantity" integer, "uom" character varying, "production_date" TIMESTAMP, "year" integer, "hje" character varying, "notes" character varying, CONSTRAINT "PK_961e2b478aac9daf4d752d78711" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD "warehouse_sub_id_claim" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD "warehouse_sub_id_unclaim" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD "warehouse_sub_id_tracking" uuid`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" ADD "inventory_tracking_bad_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD CONSTRAINT "FK_b9947b6bc163f8515c7006c3a14" FOREIGN KEY ("warehouse_sub_id_claim") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD CONSTRAINT "FK_7455e4b4e2c3b8aae3c8ae0c52f" FOREIGN KEY ("warehouse_sub_id_unclaim") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD CONSTRAINT "FK_4eafeeab2143caea71063c0a34b" FOREIGN KEY ("warehouse_sub_id_tracking") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" ADD CONSTRAINT "FK_890b5dcd06ba352c4ac0bdc52c7" FOREIGN KEY ("inbound_retur_id") REFERENCES "inbound_retur"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" ADD CONSTRAINT "FK_d95efccc655fecd5db087d7a22d" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_7759d8976196cd2ac908cca7412" FOREIGN KEY ("inventory_tracking_bad_id") REFERENCES "inventory_tracking_bad"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_7759d8976196cd2ac908cca7412"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" DROP CONSTRAINT "FK_d95efccc655fecd5db087d7a22d"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" DROP CONSTRAINT "FK_890b5dcd06ba352c4ac0bdc52c7"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP CONSTRAINT "FK_4eafeeab2143caea71063c0a34b"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP CONSTRAINT "FK_7455e4b4e2c3b8aae3c8ae0c52f"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP CONSTRAINT "FK_b9947b6bc163f8515c7006c3a14"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" DROP COLUMN "inventory_tracking_bad_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP COLUMN "warehouse_sub_id_tracking"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP COLUMN "warehouse_sub_id_unclaim"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP COLUMN "warehouse_sub_id_claim"`);
        await queryRunner.query(`DROP TABLE "inventory_tracking_bad"`);
    }

}
