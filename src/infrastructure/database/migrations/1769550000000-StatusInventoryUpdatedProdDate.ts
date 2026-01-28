import { MigrationInterface, QueryRunner } from 'typeorm';

export class StatusInventoryUpdatedProdDate1769550000000
  implements MigrationInterface
{
  name = 'StatusInventoryUpdatedProdDate1769550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."transaction_pallet_history_status_inventory_enum" ADD VALUE 'UPDATED_PROD_DATE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing an enum value directly.
    // To fully revert, you would need to recreate the enum and column (not done here).
  }
}
