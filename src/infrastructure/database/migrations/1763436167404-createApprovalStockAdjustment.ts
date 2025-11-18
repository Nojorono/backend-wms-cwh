import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApprovalStockAdjustment1763436167404 implements MigrationInterface {
    name = 'CreateApprovalStockAdjustment1763436167404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."stock_adjustment_approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "stock_adjustment_approval" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "pallet_id" uuid, "item_id" uuid, "current_quantity" integer, "requested_quantity" integer, "uom" character varying, "production_date" TIMESTAMP, "week_number" integer, "status" "public"."stock_adjustment_approval_status_enum" DEFAULT 'PENDING', "reason" character varying, "requested_by" character varying, "approved_by" character varying, "approved_at" TIMESTAMP, "rejected_by" character varying, "rejected_at" TIMESTAMP, "rejection_reason" character varying, "notes" character varying, "target_pallet_id" uuid, CONSTRAINT "PK_eee7695110ecb06ba4c5fa36a91" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_234f038692749bf079a43ade69c" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_9e751d95fc77411f5e8e8de8350" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_13617a87228eec0218329571acd" FOREIGN KEY ("target_pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT "FK_13617a87228eec0218329571acd"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT "FK_9e751d95fc77411f5e8e8de8350"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT "FK_234f038692749bf079a43ade69c"`);
        await queryRunner.query(`DROP TABLE "stock_adjustment_approval"`);
        await queryRunner.query(`DROP TYPE "public"."stock_adjustment_approval_status_enum"`);
    }

}
