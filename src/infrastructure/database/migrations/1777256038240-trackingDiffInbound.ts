import { MigrationInterface, QueryRunner } from "typeorm";

export class TrackingDiffInbound1777256038240 implements MigrationInterface {
    name = 'TrackingDiffInbound1777256038240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "quantity_difference" integer`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD "sub_inventory_difference" uuid`);
        await queryRunner.query(`ALTER TABLE "inbound_item" ADD CONSTRAINT "FK_e5cc74bf722081cf101d4936dc0" FOREIGN KEY ("sub_inventory_difference") REFERENCES "m_warehouse"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP CONSTRAINT "FK_e5cc74bf722081cf101d4936dc0"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "sub_inventory_difference"`);
        await queryRunner.query(`ALTER TABLE "inbound_item" DROP COLUMN "quantity_difference"`);
    }

}
