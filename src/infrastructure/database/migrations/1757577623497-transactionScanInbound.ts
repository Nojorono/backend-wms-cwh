import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionScanInbound1757577623497 implements MigrationInterface {
    name = 'TransactionScanInbound1757577623497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction_scan_inbound" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inbound_id" uuid, "item_id" uuid, "quantity" integer, "uom" character varying, "user_id" character varying, "user_name" character varying, "pallet_id" uuid, "status" character varying, CONSTRAINT "PK_f29b8124a4c428beeb944cfbe15" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ADD "production_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD CONSTRAINT "FK_feb674f846cabd9066bbca31b77" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD CONSTRAINT "FK_804a1b83b28595e5da20fe71ecd" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD CONSTRAINT "FK_14e7273aa19c82e3ea5512d6cd5" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP CONSTRAINT "FK_14e7273aa19c82e3ea5512d6cd5"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP CONSTRAINT "FK_804a1b83b28595e5da20fe71ecd"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP CONSTRAINT "FK_feb674f846cabd9066bbca31b77"`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" DROP COLUMN "production_date"`);
        await queryRunner.query(`DROP TABLE "transaction_scan_inbound"`);
    }

}
