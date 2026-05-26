import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundIntegrationDeliveries1779414789243 implements MigrationInterface {
    name = 'OutboundIntegrationDeliveries1779414789243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbound_integration_deliveries_transaction_type_enum" AS ENUM('Outbound GS Mutasi SO Internal', 'Outbound GS SO Subdist Pick Release', 'Outbound GS SO Subdist Ship Confirm')`);
        await queryRunner.query(`CREATE TABLE "outbound_integration_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "organization_id" character varying, "outbound_do_id" uuid, "outbound_memo_id" uuid, "outbound_memo_item_id" uuid, "iface_id" bigint, "transaction_type" "public"."outbound_integration_deliveries_transaction_type_enum", "source_system" character varying(100), "batch_id" bigint, "batch_name" character varying(100), "source_header_id" character varying(100), "source_line_id" character varying(100), "iso_header_id" bigint, "iso_line_id" bigint, "iso_inventory_item_id" bigint, "iso_organization_id" bigint, "delivery_id" bigint, "delivery_name" character varying(30), "delivery_attribute_category" character varying(150), "delivery_attribute6" character varying(150), "delivery_attribute7" character varying(150), "delivery_attribute8" character varying(150), "delivery_attribute9" character varying(150), "delivery_attribute10" character varying(150), "delivery_attribute11" character varying(150), "delivery_attribute12" character varying(150), "delivery_attribute13" character varying(150), "delivery_attribute14" character varying(150), "delivery_attribute15" character varying(150), "shipped_quantity" bigint, "create_delivery_status" character varying(30), "create_delivery_message" character varying(240), "update_delivery_status" character varying(30), "update_delivery_message" character varying(240), "pick_release_request_id" bigint, "pick_release_status" character varying(30), "pick_release_message" character varying(240), "ship_confirm_request_id" bigint, "ship_confirm_status" character varying(30), "ship_confirm_message" character varying(240), "creation_date" TIMESTAMP, "last_updated_date" TIMESTAMP, "created_by" bigint, "last_updated_by" bigint, CONSTRAINT "PK_160539accf5f04c7253dc794dff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" ADD CONSTRAINT "FK_e05fc77e6c5e5e0d1ded67c7e2a" FOREIGN KEY ("outbound_do_id") REFERENCES "outbound_do"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" ADD CONSTRAINT "FK_f7a8dc48c3a16de1ec71f7c06fe" FOREIGN KEY ("outbound_memo_id") REFERENCES "outbound_memo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" ADD CONSTRAINT "FK_0d86947e1d0477016b9624ef215" FOREIGN KEY ("outbound_memo_item_id") REFERENCES "outbound_memo_item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" DROP CONSTRAINT "FK_0d86947e1d0477016b9624ef215"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" DROP CONSTRAINT "FK_f7a8dc48c3a16de1ec71f7c06fe"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" DROP CONSTRAINT "FK_e05fc77e6c5e5e0d1ded67c7e2a"`);
        await queryRunner.query(`DROP TABLE "outbound_integration_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_integration_deliveries_transaction_type_enum"`);
    }

}
