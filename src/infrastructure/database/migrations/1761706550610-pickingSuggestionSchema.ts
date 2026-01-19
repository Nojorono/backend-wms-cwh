import { MigrationInterface, QueryRunner } from "typeorm";

export class PickingSuggestionSchema1761706550610 implements MigrationInterface {
    name = 'PickingSuggestionSchema1761706550610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_de4b92e7d96c43cf8c97fab93a3"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_11647ff58d375051d52951c3b89"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "flag_whole_pallet"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "classification"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "pallet_source_id"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "inventory_tracking_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "inventory_tracking_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "pallet_source_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "classification" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "flag_whole_pallet" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_11647ff58d375051d52951c3b89" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_de4b92e7d96c43cf8c97fab93a3" FOREIGN KEY ("pallet_source_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
