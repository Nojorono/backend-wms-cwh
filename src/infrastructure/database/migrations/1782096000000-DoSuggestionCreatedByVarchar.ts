import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoSuggestionCreatedByVarchar1782096000000 implements MigrationInterface {
  name = 'DoSuggestionCreatedByVarchar1782096000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "created_by" TYPE character varying(100) USING "created_by"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "updated_by" TYPE character varying(100) USING "updated_by"::text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "updated_by" TYPE bigint USING NULLIF(regexp_replace("updated_by", '[^0-9]', '', 'g'), '')::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "do_suggestion" ALTER COLUMN "created_by" TYPE bigint USING NULLIF(regexp_replace("created_by", '[^0-9]', '', 'g'), '')::bigint`,
    );
  }
}
