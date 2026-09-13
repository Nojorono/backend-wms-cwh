import { MigrationInterface, QueryRunner } from "typeorm";

export class ShipmentPlan1775792500113 implements MigrationInterface {
    name = 'ShipmentPlan1775792500113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shipment_plan_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "shipment_plan_id" uuid NOT NULL, "source" character varying(255) NOT NULL, "type" character varying(255) NOT NULL, "reg" character varying(255) NOT NULL, "code" character varying(255) NOT NULL, "amo" character varying(255) NOT NULL, "sku" character varying(255) NOT NULL, "metric" character varying(255) NOT NULL, "quantity" integer NOT NULL, "uom" character varying(255) NOT NULL, CONSTRAINT "PK_1c19c499adb72c31fade900252d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "organization_id" character varying, "file_name" character varying(255) NOT NULL, "file_size" integer NOT NULL, "total_extracted_rows" integer NOT NULL, "week_number" integer NOT NULL, "batch_number" character varying(255) NOT NULL, CONSTRAINT "PK_284b30e5540894e3668290cb035" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shipment_plan_items" ADD CONSTRAINT "FK_dbd45abe9add775411af1b6ce39" FOREIGN KEY ("shipment_plan_id") REFERENCES "shipment_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shipment_plan_items" DROP CONSTRAINT "FK_dbd45abe9add775411af1b6ce39"`);
        await queryRunner.query(`DROP TABLE "shipment_plans"`);
        await queryRunner.query(`DROP TABLE "shipment_plan_items"`);
    }

}
