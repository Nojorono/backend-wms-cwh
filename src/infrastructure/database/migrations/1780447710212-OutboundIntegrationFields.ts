import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundIntegrationFields1780447710212 implements MigrationInterface {
  name = 'OutboundIntegrationFields1780447710212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      ADD COLUMN IF NOT EXISTS "so_number" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      ADD COLUMN IF NOT EXISTS "so_organization_id" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      ADD COLUMN IF NOT EXISTS "header_id" integer
    `);

    // delivery_attribute_category enum was already migrated in 1779759617334.
    // Drop orphan types left by failed partial runs of auto-generated migration.
    await queryRunner.query(`
      DO $$
      BEGIN
        DROP TYPE IF EXISTS "public"."outbound_integration_deliveries_delivery_attribute_category_enu_old";
      EXCEPTION
        WHEN dependent_objects_still_exist THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        DROP TYPE IF EXISTS "public"."outbound_integration_deliveries_delivery_attribute_category_enu";
      EXCEPTION
        WHEN dependent_objects_still_exist THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      DROP COLUMN IF EXISTS "header_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      DROP COLUMN IF EXISTS "so_organization_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      DROP COLUMN IF EXISTS "so_number"
    `);
  }
}
