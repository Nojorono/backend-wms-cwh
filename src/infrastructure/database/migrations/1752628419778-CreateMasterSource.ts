import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMasterSource1752628419778 implements MigrationInterface {
    name = 'CreateMasterSource1752628419778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "m_source" ("id" SERIAL NOT NULL, "organization_id" integer, "name" character varying, "code" character varying, "type" character varying, "url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_80c706205887adcabc3d00aa466" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "m_source"`);
    }

}
