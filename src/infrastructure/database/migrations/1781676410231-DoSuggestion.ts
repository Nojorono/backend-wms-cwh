import { MigrationInterface, QueryRunner } from "typeorm";

export class DoSuggestion1781676410231 implements MigrationInterface {
    name = 'DoSuggestion1781676410231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_scheduled_tasks_name"`);
        await queryRunner.query(`CREATE TABLE "do_suggestion_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "do_suggestion_uuid" uuid, "item_code" character varying(100), "item_qty_suggestion" numeric(18,4), "item_qty_revision" numeric(18,4), "item_qty_final" numeric(18,4), "contribution_percentage" numeric(18,4), "item_uom" character varying(50), CONSTRAINT "PK_d4ea11be72310f73eaf58907776" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."do_suggestion_status_enum" AS ENUM('PENDING', 'REVISED', 'FINAL', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "do_suggestion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "organization_id" uuid, "callplan_number" character varying(100), "callplan_date_start" date, "callplan_date_end" date, "route_number" character varying(100), "trip_type" character varying(50), "sales_nik" character varying(50), "sales_name" character varying(255), "sales_spv" character varying(255), "status" "public"."do_suggestion_status_enum" DEFAULT 'PENDING', "created_by" bigint, "updated_by" bigint, CONSTRAINT "PK_d1ecbabe0a04449cc19523b399d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_332847dcb6eb4224ba96c883bb" ON "scheduled_tasks" ("name") `);
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" ADD CONSTRAINT "FK_4325ca6a6388d1a3422479ee0e0" FOREIGN KEY ("do_suggestion_uuid") REFERENCES "do_suggestion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD CONSTRAINT "FK_c2c9ada3c23c9308e4f5adaffeb" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP CONSTRAINT "FK_c2c9ada3c23c9308e4f5adaffeb"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" DROP CONSTRAINT "FK_4325ca6a6388d1a3422479ee0e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_332847dcb6eb4224ba96c883bb"`);
        await queryRunner.query(`DROP TABLE "do_suggestion"`);
        await queryRunner.query(`DROP TYPE "public"."do_suggestion_status_enum"`);
        await queryRunner.query(`DROP TABLE "do_suggestion_details"`);
        await queryRunner.query(`CREATE INDEX "IDX_scheduled_tasks_name" ON "scheduled_tasks" ("name") `);
    }

}
