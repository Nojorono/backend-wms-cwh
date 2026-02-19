import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustmentStockModule1771503904029 implements MigrationInterface {
    name = 'AdjustmentStockModule1771503904029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "adjustment_stock" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "document" character varying, "type" character varying, "code" character varying, "pallet_id" uuid, "item_id" uuid, "quantity" integer, "uom" character varying, "notes" character varying, "status" character varying, "is_inventory" character varying, CONSTRAINT "PK_f871d01f3239cc110c6df1c792f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD CONSTRAINT "FK_28755e400ae364f5ed1838ad4bf" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" ADD CONSTRAINT "FK_26c7967327c7ddb63b190699351" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP CONSTRAINT "FK_26c7967327c7ddb63b190699351"`);
        await queryRunner.query(`ALTER TABLE "adjustment_stock" DROP CONSTRAINT "FK_28755e400ae364f5ed1838ad4bf"`);
        await queryRunner.query(`DROP TABLE "adjustment_stock"`);
    }

}
