import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableRole1710330000002 implements MigrationInterface {
  name = 'CreateTableRole1710330000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" SERIAL PRIMARY KEY,
                "name" varchar NOT NULL UNIQUE,
                "description" varchar,
                "isActive" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_roles_name" ON "roles" ("name");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_roles_name"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
