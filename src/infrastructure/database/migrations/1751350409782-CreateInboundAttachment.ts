import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInboundAttachment1751350409782 implements MigrationInterface {
    name = 'CreateInboundAttachment1751350409782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inbound_attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inbound_plan_id" character varying, "organization_id" integer, "name" character varying, "path" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2e6022fdd41b4b273a15f22f207" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "inbound_attachment"`);
    }

}
