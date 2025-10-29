import { MigrationInterface, QueryRunner } from "typeorm";

export class UserManage1761705164729 implements MigrationInterface {
    name = 'UserManage1761705164729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_manage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(255) NOT NULL, "phone" character varying(255) NOT NULL, "role_name" character varying(255) NOT NULL, CONSTRAINT "PK_687496e9e57b3a9296deff2193e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_manage"`);
    }

}
