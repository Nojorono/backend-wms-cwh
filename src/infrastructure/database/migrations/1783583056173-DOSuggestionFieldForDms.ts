import { MigrationInterface, QueryRunner } from "typeorm";

export class DOSuggestionFieldForDms1783583056173 implements MigrationInterface {
    name = 'DOSuggestionFieldForDms1783583056173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_scheduled" DROP CONSTRAINT "FK_work_scheduled_organization"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_work_scheduled_default_calendar_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_work_scheduled_org_calendar_date"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "spb_type" bigint`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "mo_type" character varying`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "preparation_date" date`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e36b7656333a06b88cea9cd426" ON "work_scheduled" ("organization_id", "calendar_date") WHERE "organization_id" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8c810a345b43b245ec5c8c2610" ON "work_scheduled" ("calendar_date") WHERE "organization_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "work_scheduled" ADD CONSTRAINT "FK_7588346b69026f57e019479a3de" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_scheduled" DROP CONSTRAINT "FK_7588346b69026f57e019479a3de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c810a345b43b245ec5c8c2610"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e36b7656333a06b88cea9cd426"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "preparation_date"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "mo_type"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "spb_type"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_work_scheduled_org_calendar_date" ON "work_scheduled" ("calendar_date", "organization_id") WHERE (organization_id IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_work_scheduled_default_calendar_date" ON "work_scheduled" ("calendar_date") WHERE (organization_id IS NULL)`);
        await queryRunner.query(`ALTER TABLE "work_scheduled" ADD CONSTRAINT "FK_work_scheduled_organization" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
