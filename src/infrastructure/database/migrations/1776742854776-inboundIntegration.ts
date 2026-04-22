import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundIntegration1776742854776 implements MigrationInterface {
    name = 'InboundIntegration1776742854776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inbound_integration_transaction_type_enum" AS ENUM('Inbound GS Mutasi SO Internal', 'Inbound GS Principal', 'Add to Receipt')`);
        await queryRunner.query(`CREATE TABLE "inbound_integration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_id" uuid, "inbound_do_id" uuid, "iface_header_id" bigint, "transaction_type" "public"."inbound_integration_transaction_type_enum", "source_system" character varying(100), "receipt_source_code" character varying(30), "source_header_id" character varying(100), "do_number" character varying(30), "vendor_id" bigint, "vendor_site_id" bigint, "shipment_header_id" bigint, "org_id" bigint, "rsh_attribute1" character varying(150), "rsh_attribute2" character varying(150), "rsh_attribute3" character varying(150), "receipt_number" character varying(30), "group_id" bigint, "total_lines" bigint, "header_interface_id" bigint, "request_id" bigint, "status" character varying(30), "message" character varying(240), "created_by" bigint, "creation_date" TIMESTAMP, "last_updated_by" bigint, "last_updated_date" TIMESTAMP, CONSTRAINT "PK_64d0a5fc8c4597612693dccd5e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inbound_integration_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inbound_integration_id" uuid, "iface_line_id" bigint, "iface_header_id" bigint, "source_line_id" character varying(100), "source_header_id" character varying(100), "po_number" character varying(20), "po_line_number" bigint, "iso_number" character varying(30), "iso_line_number" bigint, "inventory_item_id" bigint, "uom_code" character varying(25), "quantity" numeric(18,6), "subinventory" character varying(10), "locator_id" bigint, "shipment_line_id" bigint, "interface_transaction_id" bigint, "status" character varying(30), "message" character varying(240), "created_by" bigint, "creation_date" TIMESTAMP, "last_updated_by" bigint, "last_updated_date" TIMESTAMP, CONSTRAINT "PK_61724f8302e5e3f08ddb60264ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD CONSTRAINT "FK_088125b8c5849a487a4ecaa22f0" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD CONSTRAINT "FK_a5d44bb5455f5334b08800e66f6" FOREIGN KEY ("inbound_do_id") REFERENCES "inbound_do"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD CONSTRAINT "FK_f873f34b3db29911a9ac7b764a2" FOREIGN KEY ("inbound_integration_id") REFERENCES "inbound_integration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP CONSTRAINT "FK_f873f34b3db29911a9ac7b764a2"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP CONSTRAINT "FK_a5d44bb5455f5334b08800e66f6"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP CONSTRAINT "FK_088125b8c5849a487a4ecaa22f0"`);
        await queryRunner.query(`DROP TABLE "inbound_integration_lines"`);
        await queryRunner.query(`DROP TABLE "inbound_integration"`);
        await queryRunner.query(`DROP TYPE "public"."inbound_integration_transaction_type_enum"`);
    }

}
