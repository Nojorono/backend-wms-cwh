import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenusTable1710330000000 implements MigrationInterface {
  name = 'CreateMenusTable1710330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "menus" (
                "id" SERIAL PRIMARY KEY,
                "name" varchar(100) NOT NULL,
                "path" varchar(200) NOT NULL UNIQUE,
                "icon" varchar(100),
                "parent_id" integer,
                "order" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_menus_path" ON "menus" ("path");
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_menus_parentId" ON "menus" ("parent_id");
        `);
    await queryRunner.query(`
            ALTER TABLE "menus"
            ADD CONSTRAINT "FK_menus_parent_id" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menus" DROP CONSTRAINT "FK_menus_parent_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_menus_path"`);
    await queryRunner.query(`DROP INDEX "IDX_menus_parentId"`);
    await queryRunner.query(`DROP TABLE "menus"`);
  }
}
