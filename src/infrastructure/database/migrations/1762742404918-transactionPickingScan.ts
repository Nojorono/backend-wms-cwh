import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionPickingScan1762742404918 implements MigrationInterface {
    name = 'TransactionPickingScan1762742404918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction_scan_picking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "transaction_picking_id" uuid, "pallet_source_id" uuid, "pallet_use_id" uuid, "pallet_switch_id" uuid, "quantity_picked" integer, "quantity_switch" integer, "uom" character varying, "week_number" integer, "status" character varying, "inspection_by" character varying, CONSTRAINT "PK_0fec0c890f1b26820468b6291fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "week_number" integer`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD CONSTRAINT "FK_8817fc3fcd9196ce1e672fbeeed" FOREIGN KEY ("transaction_picking_id") REFERENCES "transaction_picking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD CONSTRAINT "FK_8b2a90c06d5189542bcb3c42da7" FOREIGN KEY ("pallet_source_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD CONSTRAINT "FK_d7f8dc0ded289c1b68f8b1c196f" FOREIGN KEY ("pallet_use_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD CONSTRAINT "FK_ae3f7eeff0a6a84f251c1a9d27c" FOREIGN KEY ("pallet_switch_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP CONSTRAINT "FK_ae3f7eeff0a6a84f251c1a9d27c"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP CONSTRAINT "FK_d7f8dc0ded289c1b68f8b1c196f"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP CONSTRAINT "FK_8b2a90c06d5189542bcb3c42da7"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP CONSTRAINT "FK_8817fc3fcd9196ce1e672fbeeed"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "week_number"`);
        await queryRunner.query(`DROP TABLE "transaction_scan_picking"`);
    }

}
