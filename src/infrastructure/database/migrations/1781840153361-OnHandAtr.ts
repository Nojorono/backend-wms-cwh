import { MigrationInterface, QueryRunner } from "typeorm";

export class OnHandAtr1781840153361 implements MigrationInterface {
    name = 'OnHandAtr1781840153361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "on_hand_atr" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "organization_id" uuid, "item_code" character varying, "item_number" character varying, "item_description" character varying, "inventory_item_id" bigint, "oracle_organization_id" integer, "organization_code" character varying, "organization_name" character varying, "subinventory_code" character varying, "locator_id" integer, "locator" character varying, "locator_name" character varying, "quantity" integer, "avail_to_reserve" integer, "created_by" character varying, "updated_by" character varying, CONSTRAINT "PK_7a19c9dbd60d18cf4dc66498266" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" ADD CONSTRAINT "FK_c46d3bd4dafa2baa6ab56aeeb43" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "on_hand_atr" DROP CONSTRAINT "FK_c46d3bd4dafa2baa6ab56aeeb43"`);
        await queryRunner.query(`DROP TABLE "on_hand_atr"`);
    }

}
