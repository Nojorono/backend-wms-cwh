import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundDelivOrder1751938148836 implements MigrationInterface {
    name = 'InboundDelivOrder1751938148836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inbound_delivery_order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inbound_delivery_order_id" character varying, "item_id" character varying, "qty_plan" integer, "uom" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4ebfb720105854169098117435" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_delivery_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inbound_plan_id" character varying, "inbound_transporter_id" character varying, "number_delivery_order" character varying NOT NULL, "created_by" character varying, "updated_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_55910de622ae626fcedb3c643c9" UNIQUE ("number_delivery_order"), CONSTRAINT "PK_98f8ec8c6011a76991c208e6fed" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "inbound_delivery_order"`);
        await queryRunner.query(`DROP TABLE "inbound_delivery_order_item"`);
    }

}
