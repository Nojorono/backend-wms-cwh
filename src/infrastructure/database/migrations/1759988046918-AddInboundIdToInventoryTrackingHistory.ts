import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInboundIdToInventoryTrackingHistory1759988046918 implements MigrationInterface {
    name = 'AddInboundIdToInventoryTrackingHistory1759988046918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_tracking_history" ADD "inbound_id" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_tracking_history" DROP COLUMN "inbound_id"`);
    }
}
