import { MigrationInterface, QueryRunner } from "typeorm";

export class DropStockAdjustmentApproval1765268414929 implements MigrationInterface {
    name = 'DropStockAdjustmentApproval1765268414929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "FK_49f0dc744709ea682ab9b3de844"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "FK_13617a87228eec0218329571acd"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "FK_9e751d95fc77411f5e8e8de8350"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "FK_234f038692749bf079a43ade69c"`);
        
        // Drop unique constraint if exists
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "UQ_49f0dc744709ea682ab9b3de844"`);
        
        // Drop the table
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustment_approval"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the table (based on current entity structure)
        await queryRunner.query(`CREATE TABLE "stock_adjustment_approval" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "approval_id" uuid, "pallet_id" uuid, "item_id" uuid, "current_quantity" integer, "requested_quantity" integer, "uom" character varying, "production_date" TIMESTAMP, "week_number" integer, "target_pallet_id" uuid, CONSTRAINT "PK_eee7695110ecb06ba4c5fa36a91" PRIMARY KEY ("id"))`);
        
        // Recreate unique constraint
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "UQ_49f0dc744709ea682ab9b3de844" UNIQUE ("approval_id")`);
        
        // Recreate foreign key constraints
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_49f0dc744709ea682ab9b3de844" FOREIGN KEY ("approval_id") REFERENCES "approval"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_234f038692749bf079a43ade69c" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_9e751d95fc77411f5e8e8de8350" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_13617a87228eec0218329571acd" FOREIGN KEY ("target_pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
