import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAssignedHelper1757387569507 implements MigrationInterface {
    name = 'CreateAssignedHelper1757387569507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assigned_helper" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inbound_id" uuid, "helper_user_id" character varying, "helper_name" character varying, "helper_phone" character varying, CONSTRAINT "PK_d5cad20cb059ba577e93f5c2c37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_helper" ADD CONSTRAINT "FK_875004ef324d5344bc248481d80" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_helper" DROP CONSTRAINT "FK_875004ef324d5344bc248481d80"`);
        await queryRunner.query(`DROP TABLE "assigned_helper"`);
    }

}
