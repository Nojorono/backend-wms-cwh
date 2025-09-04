import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFieldPallet1756190729176 implements MigrationInterface {
  name = 'FixFieldPallet1756190729176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'm_pallet' AND column_name = 'uom_name'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'm_pallet' AND column_name = 'barcode_image_url'
        ) THEN
          EXECUTE 'ALTER TABLE "m_pallet" RENAME COLUMN "uom_name" TO "barcode_image_url"';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "m_vehicle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_type" character varying NOT NULL, "vehicle_brand" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_acc5525e6e9442189fc46116605" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_bin" ADD COLUMN IF NOT EXISTS "barcode_image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" ADD COLUMN IF NOT EXISTS "barcode_image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ADD COLUMN IF NOT EXISTS "address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ALTER COLUMN "barcode_image_url" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ALTER COLUMN "barcode_image_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN IF EXISTS "address"`);
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" DROP COLUMN IF EXISTS "barcode_image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_bin" DROP COLUMN IF EXISTS "barcode_image_url"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "m_vehicle"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'm_pallet' AND column_name = 'barcode_image_url'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'm_pallet' AND column_name = 'uom_name'
        ) THEN
          EXECUTE 'ALTER TABLE "m_pallet" RENAME COLUMN "barcode_image_url" TO "uom_name"';
        END IF;
      END
      $$;
    `);
  }
}
