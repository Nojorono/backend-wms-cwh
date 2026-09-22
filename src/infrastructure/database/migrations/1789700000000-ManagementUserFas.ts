import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManagementUserFas1789700000000 implements MigrationInterface {
  name = 'ManagementUserFas1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "management_user_fas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "organization_id" uuid,
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        CONSTRAINT "PK_management_user_fas" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_management_user_fas_organization_id'
        ) THEN
          ALTER TABLE "management_user_fas"
          ADD CONSTRAINT "FK_management_user_fas_organization_id"
          FOREIGN KEY ("organization_id") REFERENCES "m_io"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_management_user_fas_email_active"
      ON "management_user_fas" ("email")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_management_user_fas_email_active"`);
    await queryRunner.query(`
      ALTER TABLE "management_user_fas"
      DROP CONSTRAINT IF EXISTS "FK_management_user_fas_organization_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "management_user_fas"`);
  }
}
