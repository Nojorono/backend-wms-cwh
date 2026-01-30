import { MigrationInterface, QueryRunner } from "typeorm";

export class PalletUpdateTransactionWeekNumber1769494156973 implements MigrationInterface {
    name = 'PalletUpdateTransactionWeekNumber1769494156973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" ADD "weekNumber" integer DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" ADD "weekNumber" integer DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pallet_update_item" DROP COLUMN "weekNumber"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" DROP COLUMN "weekNumber"`);
    }

}
