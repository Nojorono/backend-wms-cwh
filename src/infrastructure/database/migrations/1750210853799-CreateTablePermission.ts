import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablePermission1750210853799 implements MigrationInterface {
    name = 'CreateTablePermission1750210853799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" SERIAL PRIMARY KEY,
                "action" varchar(50) NOT NULL,
                "menu_id" integer NOT NULL,
                "role_id" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_permissions_menu_id" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_permissions_roleId_menuId" ON "permissions" ("role_id", "menu_id");
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_permissions_roleId_menuId_action" ON "permissions" ("role_id", "menu_id", "action");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_permissions_roleId_menuId_action"`);
        await queryRunner.query(`DROP INDEX "IDX_permissions_roleId_menuId"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }
}