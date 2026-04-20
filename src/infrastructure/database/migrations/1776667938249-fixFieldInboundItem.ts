import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFieldInboundItem1776667938249 implements MigrationInterface {
    name = 'FixFieldInboundItem1776667938249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "uom_inspection"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "item_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "item_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD CONSTRAINT "FK_d6e2205b313d09193fe72b208cd" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP CONSTRAINT "FK_d6e2205b313d09193fe72b208cd"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "item_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "item_id" character varying`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "uom_inspection" character varying`);
    }

}
