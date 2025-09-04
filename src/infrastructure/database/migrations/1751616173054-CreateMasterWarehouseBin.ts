import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterWarehouseBin1751616173054
  implements MigrationInterface
{
  name = 'CreateMasterWarehouseBin1751616173054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" RENAME COLUMN "capacity" TO "capacity_bin"`,
    );
    await queryRunner.query(
      `CREATE TABLE "m_warehouse_bin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "warehouse_sub_id" character varying, "name" character varying, "code" character varying, "description" character varying, "capacity_pallet" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cdd0357b4552e75fd34592c9a91" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "m_warehouse_bin"`);
    await queryRunner.query(
      `ALTER TABLE "m_warehouse_sub" RENAME COLUMN "capacity_bin" TO "capacity"`,
    );
  }
}
