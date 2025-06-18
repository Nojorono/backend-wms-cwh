import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterUomTable1710330000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "m_uom" (
        "id" SERIAL PRIMARY KEY,
        "code" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add unique constraint for code
    await queryRunner.query(`
      ALTER TABLE "m_uom"
      ADD CONSTRAINT "UQ_m_uom_code"
      UNIQUE ("code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "m_uom"
    `);
  }
} 