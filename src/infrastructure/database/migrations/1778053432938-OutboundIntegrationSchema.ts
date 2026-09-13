import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundIntegrationSchema1778053432938 implements MigrationInterface {
    name = 'OutboundIntegrationSchema1778053432938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbound_integration_ir_req" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "organization_id" character varying, "outbound_memo_id" uuid, "iface_header_id" bigint, "transaction_type" character varying(200), "source_code" character varying(30), "source_header_id" character varying(100), "need_by_date" TIMESTAMP, "preparer_number" character varying(30), "preparer_id" character varying(30), "requestor_number" character varying(30), "requestor_id" character varying(30), "org_name" character varying(50), "org_id" bigint, "io_source_name" character varying(50), "io_source_id" bigint, "io_dest_name" character varying(50), "io_dest_id" bigint, "header_attribute_category" character varying(30), "header_attribute7" character varying(150), "ir_header_id" bigint, "ir_number" bigint, "so_header_id" bigint, "so_number" bigint, "total_lines" bigint, "batch_number" character varying(100), "iface_status_ir" character varying(100), "iface_message_ir" character varying(4000), "iface_status_io" character varying(100), "iface_message_io" character varying(4000), "iface_status_oi" character varying(100), "iface_message_oi" character varying(4000), "request_id_ir" bigint, "request_id_io" bigint, "request_id_oi" bigint, "creation_date" TIMESTAMP, "last_updated_date" TIMESTAMP, "created_by" bigint, "last_updated_by" bigint, CONSTRAINT "PK_67c133325ab6e7de3d309aec4d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "outbound_integration_ir_req_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "outbound_memo_item_id" uuid, "iface_header_id" bigint, "iface_line_id" bigint, "source_header_id" character varying(100), "source_line_id" character varying(100), "inventory_item_id" bigint, "item" character varying(40), "quantity" bigint, "transaction_uom" character varying(5), "ir_line_id" bigint, "ir_line_number" bigint, "so_line_id" bigint, "so_line_number" bigint, "iface_line_status_ir" character varying(100), "iface_line_message_ir" character varying(4000), "creation_date" TIMESTAMP, "last_updated_date" TIMESTAMP, "created_by" bigint, "last_updated_by" bigint, CONSTRAINT "PK_63f9f281e22822393f398d54ac7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" ADD CONSTRAINT "FK_91986039f8a90dfbf22828f6712" FOREIGN KEY ("outbound_memo_id") REFERENCES "outbound_memo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" ADD CONSTRAINT "FK_c5b42d8db9a7082b5b88132ca3b" FOREIGN KEY ("outbound_memo_item_id") REFERENCES "outbound_memo_item"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" DROP CONSTRAINT "FK_c5b42d8db9a7082b5b88132ca3b"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" DROP CONSTRAINT "FK_91986039f8a90dfbf22828f6712"`);
        await queryRunner.query(`DROP TABLE "outbound_integration_ir_req_lines"`);
        await queryRunner.query(`DROP TABLE "outbound_integration_ir_req"`);
    }

}
