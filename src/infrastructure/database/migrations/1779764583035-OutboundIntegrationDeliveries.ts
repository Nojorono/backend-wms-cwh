import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundIntegrationDeliveries1779764583035 implements MigrationInterface {
  name = 'OutboundIntegrationDeliveries1779764583035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbound_do"
      ADD COLUMN IF NOT EXISTS "truck_utilitas" character varying(150)
    `);

    // delivery_attribute_category enum was already migrated in 1779759617334.
    // Drop orphan types left by failed partial runs of this migration.
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
      ALTER TABLE "outbound_do"
      DROP COLUMN IF EXISTS "truck_utilitas"
    `);
  }
}
