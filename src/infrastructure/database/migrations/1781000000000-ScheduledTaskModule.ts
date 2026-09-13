import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScheduledTaskModule1781000000000 implements MigrationInterface {
  name = 'ScheduledTaskModule1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "scheduled_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "schedule" character varying NOT NULL,
        "callback_type" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_scheduled_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_scheduled_tasks_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_scheduled_tasks_name" ON "scheduled_tasks" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_scheduled_tasks_name"`);
    await queryRunner.query(`DROP TABLE "scheduled_tasks"`);
  }
}
