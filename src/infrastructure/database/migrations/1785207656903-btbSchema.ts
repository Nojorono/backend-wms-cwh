import { MigrationInterface, QueryRunner } from "typeorm";

export class BtbSchema1785207656903 implements MigrationInterface {
    name = 'BtbSchema1785207656903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "btb_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "btb_uuid" uuid, "item_code" character varying(100), "inventory_item_id" bigint, "item_name" character varying(255), "btb_qty" numeric(18,4), "btb_uom" character varying(50), "created_by" character varying(100), "updated_by" character varying(100), CONSTRAINT "PK_1cc98fd9085724cc4c5b09e04a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "btb" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "btb_number" character varying(100), "btb_date" date, "organization_code" character varying(100), "organization_id" uuid, "sales_nik" character varying(50), "sales_name" character varying(255), "sales_spv_nik" character varying(50), "sales_spv_name" character varying(255), "status" character varying(50), "created_by" character varying(100), "updated_by" character varying(100), CONSTRAINT "PK_3431cae6a2d251fce7e50b540be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "btb_details" ADD CONSTRAINT "FK_b48b4e8f21170bf11c3511b6f2c" FOREIGN KEY ("btb_uuid") REFERENCES "btb"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "btb" ADD CONSTRAINT "FK_975d232b22bd10b306ffa3d17cb" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "btb" DROP CONSTRAINT "FK_975d232b22bd10b306ffa3d17cb"`);
        await queryRunner.query(`ALTER TABLE "btb_details" DROP CONSTRAINT "FK_b48b4e8f21170bf11c3511b6f2c"`);
        await queryRunner.query(`DROP TABLE "btb"`);
        await queryRunner.query(`DROP TABLE "btb_details"`);
    }

}
