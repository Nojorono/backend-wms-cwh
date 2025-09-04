import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBaseEntity1756870688935 implements MigrationInterface {
  name = 'FixBaseEntity1756870688935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "uom"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "m_warehouse" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_bin" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_vehicle" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "m_uom" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "m_supplier" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "m_item" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "m_classification_item" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "m_io" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "m_uom" DROP CONSTRAINT "m_uom_pkey"`);
    await queryRunner.query(`ALTER TABLE "m_uom" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "m_uom" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_uom" ADD CONSTRAINT "PK_06f5c8df6a3f1f251a8ab6d4fb6" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" DROP CONSTRAINT "PK_m_pallet"`,
    );
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD CONSTRAINT "PK_e160cf7b71e3a0cff005226705b" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_io" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" DROP CONSTRAINT "PK_e160cf7b71e3a0cff005226705b"`,
    );
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD CONSTRAINT "PK_m_pallet" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_uom" DROP CONSTRAINT "PK_06f5c8df6a3f1f251a8ab6d4fb6"`,
    );
    await queryRunner.query(`ALTER TABLE "m_uom" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "m_uom" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "m_uom" ADD CONSTRAINT "m_uom_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "m_classification_item" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "m_supplier" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "m_uom" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "m_vehicle" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_bin" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_warehouse" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "uom" character varying`,
    );
  }
}
