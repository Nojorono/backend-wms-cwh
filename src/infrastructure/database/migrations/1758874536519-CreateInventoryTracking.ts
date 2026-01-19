import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTracking1758874536519 implements MigrationInterface {
  name = 'CreateInventoryTracking1758874536519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "inventory_tracking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "pallet_id" uuid, "warehouse_id" uuid, "warehouse_sub_id" uuid, "warehouse_bin_id" uuid, "inventory_date" TIMESTAMP, "inventory_status" character varying, "inventory_note" character varying, CONSTRAINT "PK_52eb050a6dac1f822c01c653da5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_47edf53e55e4fe15867655d5b8a" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_f302dddb5442dc2a9d25d4e5317" FOREIGN KEY ("warehouse_id") REFERENCES "m_warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_43f086021701801d6d879cf249f" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_82b3e167a6bfd046394b77dd90c" FOREIGN KEY ("warehouse_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_82b3e167a6bfd046394b77dd90c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_43f086021701801d6d879cf249f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_f302dddb5442dc2a9d25d4e5317"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_47edf53e55e4fe15867655d5b8a"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_tracking"`);
  }
}
