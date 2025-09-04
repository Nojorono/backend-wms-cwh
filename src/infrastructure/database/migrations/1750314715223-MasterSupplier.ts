import { MigrationInterface, QueryRunner } from 'typeorm';

export class MasterSupplier1750314715223 implements MigrationInterface {
  name = 'MasterSupplier1750314715223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "m_supplier" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "operating_unit" character varying, "supplier_code" character varying, "supplier_name" character varying, "supplier_address" character varying, "supplier_contact_person" character varying, "supplier_phone" character varying, "supplier_email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_m_supplier" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "client_id"`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" DROP CONSTRAINT "UQ_m_pallet_code"`,
    );
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "code"`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "organization_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "pallet_code" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "m_supplier"`);
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "pallet_code"`);
    await queryRunner.query(
      `ALTER TABLE "m_pallet" DROP COLUMN "organization_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "code" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD CONSTRAINT "UQ_m_pallet_code" UNIQUE ("code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "client_id" character varying`,
    );
  }
}
