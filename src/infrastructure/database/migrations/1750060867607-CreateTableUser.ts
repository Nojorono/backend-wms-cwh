import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1750060867607 implements MigrationInterface {
    name = 'CreateTableUser1750060867607'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" varchar(100) NOT NULL UNIQUE,
                "password" varchar(255) NOT NULL,
                "first_name" varchar(100) NOT NULL,
                "last_name" varchar(100) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "role_id" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
            );
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username");
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_users_roleId" ON "users" ("role_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_roleId"`);
        await queryRunner.query(`DROP INDEX "IDX_users_username"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}