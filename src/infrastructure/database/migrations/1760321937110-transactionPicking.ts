import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionPicking1760321937110 implements MigrationInterface {
    name = 'TransactionPicking1760321937110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transaction_picking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inventory_tracking_id" uuid, "source_warehouse_sub_id" uuid, "source_bin_id" uuid, "pallet_id" uuid, "quantity" integer, "classification" character varying, "status" character varying DEFAULT 'PENDING', "memo_id" uuid, "item_id" uuid, CONSTRAINT "PK_cb543004b48610b1d55523c9130" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_894ba64270f9222d701c82bc5f1" FOREIGN KEY ("memo_id") REFERENCES "outbound_memo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_509a595e002c7def589c722f8e1" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_11647ff58d375051d52951c3b89" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_9e126a551065711dd258e9d9ee7" FOREIGN KEY ("source_warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_9691c8e6e7031e5f2706887185f" FOREIGN KEY ("source_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_a916d1891768ea69a586df955ff" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_a916d1891768ea69a586df955ff"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_9691c8e6e7031e5f2706887185f"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_9e126a551065711dd258e9d9ee7"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_11647ff58d375051d52951c3b89"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_509a595e002c7def589c722f8e1"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_894ba64270f9222d701c82bc5f1"`);
        await queryRunner.query(`DROP TABLE "transaction_picking"`);
    }

}
