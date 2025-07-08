import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldInboundDelivOrder1751958422429 implements MigrationInterface {
    name = 'ChangeFieldInboundDelivOrder1751958422429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" DROP COLUMN "inbound_delivery_order_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" ADD "inbound_delivery_order_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" ADD CONSTRAINT "FK_088b750de300ae6dcf6234fc699" FOREIGN KEY ("inbound_delivery_order_id") REFERENCES "inbound_delivery_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" DROP CONSTRAINT "FK_088b750de300ae6dcf6234fc699"`);
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" DROP COLUMN "inbound_delivery_order_id"`);
        await queryRunner.query(`ALTER TABLE "inbound_delivery_order_item" ADD "inbound_delivery_order_id" character varying`);
    }

}
