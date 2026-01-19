import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldTransactionPicking1762930099926 implements MigrationInterface {
    name = 'AddFieldTransactionPicking1762930099926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "destination_warehouse_sub_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "destination_bin_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_380c9623a4efef3ed5121366bdd" FOREIGN KEY ("destination_warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_5e292b4c2282121d8aac58a148d" FOREIGN KEY ("destination_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_5e292b4c2282121d8aac58a148d"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_380c9623a4efef3ed5121366bdd"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "destination_bin_id"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "destination_warehouse_sub_id"`);
    }

}
