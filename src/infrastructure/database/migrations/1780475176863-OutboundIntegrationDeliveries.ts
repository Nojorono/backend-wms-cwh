import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundIntegrationDeliveries1780475176863 implements MigrationInterface {
  name = 'OutboundIntegrationDeliveries1780475176863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbound_memo"
      ADD COLUMN IF NOT EXISTS "delivery_attribute14" character varying
    `);

    // delivery_attribute_category enum already exists (1779759617334 / 1779420000000).
    // TypeORM migration:generate repeats enum SQL because PG truncates long type names
    // (...category_enum -> ...category_enu). Drop orphan types from failed partial runs.
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
      DROP COLUMN IF EXISTS "delivery_attribute14"
    `);
  }
}
