import { MigrationInterface, QueryRunner } from "typeorm";

export class StatusInventoryPallet1769573107592 implements MigrationInterface {
    name = 'StatusInventoryPallet1769573107592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_status_inventory_enum" RENAME TO "transaction_pallet_history_status_inventory_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_status_inventory_enum" AS ENUM('READY', 'PENDING', 'UPDATED_PROD_DATE')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" TYPE "public"."transaction_pallet_history_status_inventory_enum" USING "status_inventory"::"text"::"public"."transaction_pallet_history_status_inventory_enum"`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_status_inventory_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_status_inventory_enum_old" AS ENUM('READY', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" TYPE "public"."transaction_pallet_history_status_inventory_enum_old" USING "status_inventory"::"text"::"public"."transaction_pallet_history_status_inventory_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "status_inventory" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_status_inventory_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_status_inventory_enum_old" RENAME TO "transaction_pallet_history_status_inventory_enum"`);
    }

}
