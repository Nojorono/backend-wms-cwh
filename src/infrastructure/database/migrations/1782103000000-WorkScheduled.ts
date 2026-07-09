import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkScheduled1782103000000 implements MigrationInterface {
  name = 'WorkScheduled1782103000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."work_scheduled_day_type_enum" AS ENUM('DAY_OFF', 'WORKING', 'WEEKEND', 'HOLIDAY')`,
    );
    await queryRunner.query(`
      CREATE TABLE "work_scheduled" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "organization_id" uuid,
        "calendar_date" date NOT NULL,
        "day_type" "public"."work_scheduled_day_type_enum" NOT NULL,
        "name" character varying(255),
        "description" text,
        "created_by" character varying(100),
        "updated_by" character varying(100),
        CONSTRAINT "PK_work_scheduled" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_work_scheduled_default_calendar_date"
      ON "work_scheduled" ("calendar_date")
      WHERE "organization_id" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_work_scheduled_org_calendar_date"
      ON "work_scheduled" ("organization_id", "calendar_date")
      WHERE "organization_id" IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "work_scheduled"
      ADD CONSTRAINT "FK_work_scheduled_organization"
      FOREIGN KEY ("organization_id") REFERENCES "m_io"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "work_scheduled" DROP CONSTRAINT "FK_work_scheduled_organization"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_work_scheduled_org_calendar_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_work_scheduled_default_calendar_date"`);
    await queryRunner.query(`DROP TABLE "work_scheduled"`);
    await queryRunner.query(`DROP TYPE "public"."work_scheduled_day_type_enum"`);
  }
}
