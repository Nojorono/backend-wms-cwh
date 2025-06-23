import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundPlanWithChecker1750660194728 implements MigrationInterface {
    name = 'InboundPlanWithChecker1750660194728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inbound_plan_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expired_date" date, "qty_plan" numeric(10,2), "uom" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "inbound_plan_id" uuid, "item_id" uuid, "classification_item_id" uuid, CONSTRAINT "PK_9f46903e9e905c02483c9c9f27f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "inbound_planning_no" character varying, "delivery_no" character varying, "po_no" character varying, "client_name" character varying, "order_type" character varying, "task_type" character varying, "notes" character varying, "plan_delivery_date" TIMESTAMP, "plan_status" character varying, "plan_type" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "supplier_id" uuid, "warehouse_id" uuid, CONSTRAINT "PK_2e21aef6ed26a192437009a9e8a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "checker_assign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inbound_plan_id" character varying, "status" character varying, "assign_date_start" TIMESTAMP, "assign_date_finish" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "checker_leader_id" uuid, CONSTRAINT "PK_e0cbe1724cf9563328924f576b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "checker_assign_user" ("checker_assign_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_df6c39d4b24843cd769e0bc2237" PRIMARY KEY ("checker_assign_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4aefebd32a580c3bc2c76afb73" ON "checker_assign_user" ("checker_assign_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9fbfd283f1a29f43cb6eb764fb" ON "checker_assign_user" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" ADD CONSTRAINT "FK_5818e3ae374d9c74459acb4677f" FOREIGN KEY ("inbound_plan_id") REFERENCES "inbound_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" ADD CONSTRAINT "FK_2aa5764c4c0b570be7f0d218367" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" ADD CONSTRAINT "FK_c644a47e39cdedfaa035eb4510a" FOREIGN KEY ("classification_item_id") REFERENCES "m_classification_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_plan" ADD CONSTRAINT "FK_dcc0e6d19b711831df332ca5152" FOREIGN KEY ("supplier_id") REFERENCES "m_supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_plan" ADD CONSTRAINT "FK_bda1bccbd366fe806b5053d1954" FOREIGN KEY ("warehouse_id") REFERENCES "m_warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checker_assign" ADD CONSTRAINT "FK_dc5a66632d2fbd73c8492795f20" FOREIGN KEY ("checker_leader_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checker_assign_user" ADD CONSTRAINT "FK_4aefebd32a580c3bc2c76afb735" FOREIGN KEY ("checker_assign_id") REFERENCES "checker_assign"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "checker_assign_user" ADD CONSTRAINT "FK_9fbfd283f1a29f43cb6eb764fb3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_assign_user" DROP CONSTRAINT "FK_9fbfd283f1a29f43cb6eb764fb3"`);
        await queryRunner.query(`ALTER TABLE "checker_assign_user" DROP CONSTRAINT "FK_4aefebd32a580c3bc2c76afb735"`);
        await queryRunner.query(`ALTER TABLE "checker_assign" DROP CONSTRAINT "FK_dc5a66632d2fbd73c8492795f20"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan" DROP CONSTRAINT "FK_bda1bccbd366fe806b5053d1954"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan" DROP CONSTRAINT "FK_dcc0e6d19b711831df332ca5152"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" DROP CONSTRAINT "FK_c644a47e39cdedfaa035eb4510a"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" DROP CONSTRAINT "FK_2aa5764c4c0b570be7f0d218367"`);
        await queryRunner.query(`ALTER TABLE "inbound_plan_item" DROP CONSTRAINT "FK_5818e3ae374d9c74459acb4677f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9fbfd283f1a29f43cb6eb764fb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4aefebd32a580c3bc2c76afb73"`);
        await queryRunner.query(`DROP TABLE "checker_assign_user"`);
        await queryRunner.query(`DROP TABLE "checker_assign"`);
        await queryRunner.query(`DROP TABLE "inbound_plan"`);
        await queryRunner.query(`DROP TABLE "inbound_plan_item"`);
    }

}
