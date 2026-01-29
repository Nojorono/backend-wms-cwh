import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundRetur1769585144064 implements MigrationInterface {
    name = 'InboundRetur1769585144064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inbound_retur_helper" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_retur_id" uuid, "helper_user_id" character varying, "helper_name" character varying, "helper_phone" character varying, CONSTRAINT "PK_f7d13b8c1f28323f602e2dcb232" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_retur_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_retur_id" uuid, "item_id" character varying, "quantity" integer, "classification_id" character varying, "uom" character varying, CONSTRAINT "PK_e498b17d441dd6c0f9d77425d11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_retur_sorting" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_retur_id" uuid, "item_id" uuid, "quantity_claim" integer, "quantity_unclaim" integer, "quantity_tracking" integer, "uom" character varying, "hje" character varying, "year" character varying, "notes" character varying, "status" character varying DEFAULT 'PENDING', CONSTRAINT "PK_f55f81e00610da127326494ed2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_retur" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_retur_id_reference" character varying, "inbound_retur_number" character varying, "meta_number" character varying, "expedition" character varying, "origin" character varying, "license_plate" character varying, "driver_name" character varying, "driver_phone" character varying, "status" character varying, "inbound_retur_type" character varying, "arrival_date" TIMESTAMP, "notes" character varying, CONSTRAINT "PK_1e84247c63208ed363ff3d4e5f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_helper" ADD CONSTRAINT "FK_e7d6608d296cf5d12881f1a8a3c" FOREIGN KEY ("inbound_retur_id") REFERENCES "inbound_retur"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_item" ADD CONSTRAINT "FK_881dd976fe81ad68da1f6ecf9e0" FOREIGN KEY ("inbound_retur_id") REFERENCES "inbound_retur"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD CONSTRAINT "FK_ea34863e0a62fd9d16eeef03c38" FOREIGN KEY ("inbound_retur_id") REFERENCES "inbound_retur"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" ADD CONSTRAINT "FK_0360ba68953bb9781920f580071" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP CONSTRAINT "FK_0360ba68953bb9781920f580071"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_sorting" DROP CONSTRAINT "FK_ea34863e0a62fd9d16eeef03c38"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_item" DROP CONSTRAINT "FK_881dd976fe81ad68da1f6ecf9e0"`);
        await queryRunner.query(`ALTER TABLE "inbound_retur_helper" DROP CONSTRAINT "FK_e7d6608d296cf5d12881f1a8a3c"`);
        await queryRunner.query(`DROP TABLE "inbound_retur"`);
        await queryRunner.query(`DROP TABLE "inbound_retur_sorting"`);
        await queryRunner.query(`DROP TABLE "inbound_retur_item"`);
        await queryRunner.query(`DROP TABLE "inbound_retur_helper"`);
    }

}
