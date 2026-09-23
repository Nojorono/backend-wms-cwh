import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoSuggestionStatusCompleted1789800000000 implements MigrationInterface {
  name = 'DoSuggestionStatusCompleted1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."do_suggestion_status_enum" RENAME TO "do_suggestion_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."do_suggestion_status_enum" AS ENUM('DRAFT', 'REVISED', 'SUBMITTED', 'FINAL', 'VOID', 'VOID_NEED_ACTION', 'COMPLETED')`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" TYPE "public"."do_suggestion_status_enum" USING "status"::"text"::"public"."do_suggestion_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    await queryRunner.query(`DROP TYPE "public"."do_suggestion_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."do_suggestion_status_enum_old" AS ENUM('DRAFT', 'REVISED', 'SUBMITTED', 'FINAL', 'VOID', 'VOID_NEED_ACTION')`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" TYPE "public"."do_suggestion_status_enum_old" USING (
        CASE
          WHEN "status"::"text" = 'COMPLETED' THEN 'FINAL'
          ELSE "status"::"text"
        END
      )::"public"."do_suggestion_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    await queryRunner.query(`DROP TYPE "public"."do_suggestion_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."do_suggestion_status_enum_old" RENAME TO "do_suggestion_status_enum"`,
    );
  }
}
