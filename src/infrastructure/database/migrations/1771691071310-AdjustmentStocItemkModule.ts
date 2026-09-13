import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustmentStocItemkModule1771691071310 implements MigrationInterface {
    name = 'AdjustmentStocItemkModule1771691071310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP CONSTRAINT "FK_26c7967327c7ddb63b190699351"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP CONSTRAINT "FK_28755e400ae364f5ed1838ad4bf"`);
        await queryRunner.query(`CREATE TABLE "adjustment_stock_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "adjustment_stock_id" uuid, "warehouse_sub_id" uuid, "warehouse_bin_id" uuid, "pallet_id" uuid, "item_id" uuid, "quantity" integer, "uom" character varying, CONSTRAINT "PK_26c7967327c7ddb63b190699351" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "item_id"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "pallet_id"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "uom"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" ADD CONSTRAINT "FK_4aaa4255bbfb26a660504f0ebe5" FOREIGN KEY ("adjustment_stock_id") REFERENCES "adjustment_stock"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" ADD CONSTRAINT "FK_d67516b2bd39de1c8488e1fbd19" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" ADD CONSTRAINT "FK_9444a3092656bd0dfbc7a7a1adf" FOREIGN KEY ("warehouse_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" ADD CONSTRAINT "FK_0c270a460a62c4c757b0b0ed7fa" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" ADD CONSTRAINT "FK_4adc7698a565a0267750a213b9a" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" DROP CONSTRAINT "FK_4adc7698a565a0267750a213b9a"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" DROP CONSTRAINT "FK_0c270a460a62c4c757b0b0ed7fa"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" DROP CONSTRAINT "FK_9444a3092656bd0dfbc7a7a1adf"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" DROP CONSTRAINT "FK_d67516b2bd39de1c8488e1fbd19"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock_item" DROP CONSTRAINT "FK_4aaa4255bbfb26a660504f0ebe5"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "quantity" integer`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "uom" character varying`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "pallet_id" uuid`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD "item_id" uuid`);
        await queryRunner.query(`DROP TABLE "adjustment_stock_item"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD CONSTRAINT "FK_28755e400ae364f5ed1838ad4bf" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD CONSTRAINT "FK_26c7967327c7ddb63b190699351" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
