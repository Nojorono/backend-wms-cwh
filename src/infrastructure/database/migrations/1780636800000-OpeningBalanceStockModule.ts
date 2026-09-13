import { MigrationInterface, QueryRunner } from 'typeorm';

export class OpeningBalanceStockModule1780636800000 implements MigrationInterface {
  name = 'OpeningBalanceStockModule1780636800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "opening_balance_stock" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "code" character varying,
        "document" text,
        "organization_id" character varying,
        "period_date" date,
        "week_number" integer,
        "notes" character varying,
        "status" character varying DEFAULT 'DRAFT',
        "source" character varying DEFAULT 'MANUAL',
        "file_name" character varying,
        "total_items" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_opening_balance_stock" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "opening_balance_stock_item" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "opening_balance_stock_id" uuid,
        "item_code" character varying,
        "warehouse_sub_code" character varying,
        "warehouse_bin_code" character varying,
        "pallet_code" character varying,
        "item_id" uuid,
        "warehouse_sub_id" uuid,
        "warehouse_bin_id" uuid,
        "pallet_id" uuid,
        "quantity" integer,
        "uom" character varying,
        "production_date" date,
        "week_number" integer,
        "notes" character varying,
        CONSTRAINT "PK_opening_balance_stock_item" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "opening_balance_stock_item"
      ADD CONSTRAINT "FK_obs_item_opening_balance_stock"
      FOREIGN KEY ("opening_balance_stock_id")
      REFERENCES "opening_balance_stock"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "opening_balance_stock_item"
      ADD CONSTRAINT "FK_obs_item_item"
      FOREIGN KEY ("item_id")
      REFERENCES "m_item"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "opening_balance_stock_item"
      ADD CONSTRAINT "FK_obs_item_warehouse_sub"
      FOREIGN KEY ("warehouse_sub_id")
      REFERENCES "m_warehouse_sub"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "opening_balance_stock_item"
      ADD CONSTRAINT "FK_obs_item_warehouse_bin"
      FOREIGN KEY ("warehouse_bin_id")
      REFERENCES "m_warehouse_bin"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "opening_balance_stock_item"
      ADD CONSTRAINT "FK_obs_item_pallet"
      FOREIGN KEY ("pallet_id")
      REFERENCES "m_pallet"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_opening_balance_stock_code" ON "opening_balance_stock" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_obs_item_opening_balance_stock_id" ON "opening_balance_stock_item" ("opening_balance_stock_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_obs_item_opening_balance_stock_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opening_balance_stock_code"`);
    await queryRunner.query(
      `ALTER TABLE "opening_balance_stock_item" DROP CONSTRAINT IF EXISTS "FK_obs_item_pallet"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opening_balance_stock_item" DROP CONSTRAINT IF EXISTS "FK_obs_item_warehouse_bin"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opening_balance_stock_item" DROP CONSTRAINT IF EXISTS "FK_obs_item_warehouse_sub"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opening_balance_stock_item" DROP CONSTRAINT IF EXISTS "FK_obs_item_item"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opening_balance_stock_item" DROP CONSTRAINT IF EXISTS "FK_obs_item_opening_balance_stock"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "opening_balance_stock_item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opening_balance_stock"`);
  }
}
