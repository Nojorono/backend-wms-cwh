import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassificationItem1750652984591 implements MigrationInterface {
    name = 'CreateClassificationItem1750652984591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_role_id"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_permissions_menu_id"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_permissions_role_id"`);
        await queryRunner.query(`ALTER TABLE "menus" DROP CONSTRAINT "FK_menus_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_username"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_roleId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_roles_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_permissions_roleId_menuId"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_permissions_roleId_menuId_action"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_menus_path"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_menus_parentId"`);
        await queryRunner.query(`CREATE TABLE "m_classification_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "classification_name" character varying, "classification_code" character varying, "classification_description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_17ddc4a5c2417633e1b351eade5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a2cecd1a3531c0b041e29ba46e" ON "users" ("role_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_648e3f5447f725579d7d4ffdfb" ON "roles" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_73d990b51acc39670ed2023d9b" ON "permissions" ("role_id", "menu_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_00ccc1ed4e9fc23bc124626935" ON "menus" ("parent_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2aba70b42a11fed06c5ad55865" ON "menus" ("path") `);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "UQ_12a5159cbff25798975064455ac" UNIQUE ("role_id", "menu_id", "action")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_b9bcaf1da5095642dc631ffbabf" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_f10931e7bb05a3b434642ed2797" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menus" ADD CONSTRAINT "FK_00ccc1ed4e9fc23bc1246269359" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menus" DROP CONSTRAINT "FK_00ccc1ed4e9fc23bc1246269359"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_f10931e7bb05a3b434642ed2797"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_b9bcaf1da5095642dc631ffbabf"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "UQ_12a5159cbff25798975064455ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2aba70b42a11fed06c5ad55865"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00ccc1ed4e9fc23bc124626935"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73d990b51acc39670ed2023d9b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_648e3f5447f725579d7d4ffdfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2cecd1a3531c0b041e29ba46e"`);
        await queryRunner.query(`DROP TABLE "m_classification_item"`);
        await queryRunner.query(`CREATE INDEX "IDX_menus_parentId" ON "menus" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_menus_path" ON "menus" ("path") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_permissions_roleId_menuId_action" ON "permissions" ("action", "menu_id", "role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_permissions_roleId_menuId" ON "permissions" ("menu_id", "role_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_roles_name" ON "roles" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_roleId" ON "users" ("role_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username") `);
        await queryRunner.query(`ALTER TABLE "menus" ADD CONSTRAINT "FK_menus_parent_id" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_menu_id" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
