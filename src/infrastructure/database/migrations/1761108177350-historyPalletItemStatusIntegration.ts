import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryPalletItemStatusIntegration1761108177350 implements MigrationInterface {
  name = 'HistoryPalletItemStatusIntegration1761108177350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_pallet_history_status_inventory_enum" AS ENUM('READY', 'PENDING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_pallet_history" ADD "status_inventory" "public"."transaction_pallet_history_status_inventory_enum" NOT NULL DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_pallet_history" DROP COLUMN "status_inventory"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_pallet_history_status_inventory_enum"`,
    );
  }
}
