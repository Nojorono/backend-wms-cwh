import { MigrationInterface, QueryRunner } from "typeorm";

export class MasterIOWarehouse1750305220741 implements MigrationInterface {
    name = 'MasterIOWarehouse1750305220741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "m_warehouse" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "name" character varying, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2e70e5e4b0ee077f18203327957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "m_io" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "organization_name" character varying, "operating_unit" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d0cff26b00459f59a15fd2e5d1" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "m_io"`);
        await queryRunner.query(`DROP TABLE "m_warehouse"`);
    }

}
