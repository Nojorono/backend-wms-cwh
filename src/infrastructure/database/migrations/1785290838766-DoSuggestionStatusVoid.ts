import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoSuggestionStatusVoid1785290838766 implements MigrationInterface {
  name = 'DoSuggestionStatusVoid1785290838766';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."do_suggestion_status_enum" RENAME TO "do_suggestion_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."do_suggestion_status_enum" AS ENUM('DRAFT', 'REVISED', 'SUBMITTED', 'FINAL', 'VOID')`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" TYPE "public"."do_suggestion_status_enum" USING "status"::"text"::"public"."do_suggestion_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."do_suggestion_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "do_suggestion" SET "status" = 'DRAFT' WHERE "status"::text = 'VOID'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."do_suggestion_status_enum" RENAME TO "do_suggestion_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."do_suggestion_status_enum" AS ENUM('DRAFT', 'REVISED', 'SUBMITTED', 'FINAL')`,
    );
    await queryRunner.query(`ALTER TABLE "do_suggestion" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" TYPE "public"."do_suggestion_status_enum" USING "status"::"text"::"public"."do_suggestion_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."do_suggestion_status_enum_old"`);
  }
}
