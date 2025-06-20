import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableItemSku1750393403275 implements MigrationInterface {
    name = 'CreateTableItemSku1750393403275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "m_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying, "name" character varying, "description" character varying, "organization_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d51d0cc2cdc8c3d8d269d2d5f11" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "m_item"`);
    }

}
