import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterWarehouseSub1751615240935
  implements MigrationInterface
{
  name = 'CreateMasterWarehouseSub1751615240935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "m_warehouse_sub" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" integer, "warehouse_id" character varying, "name" character varying, "code" character varying, "description" character varying, "capacity" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da8f4dbc9ce2212f243ea0db29d" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "m_warehouse_sub"`);
  }
}
