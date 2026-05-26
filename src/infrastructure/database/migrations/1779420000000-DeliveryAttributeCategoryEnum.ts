import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeliveryAttributeCategoryEnum1779420000000 implements MigrationInterface {
  name = 'DeliveryAttributeCategoryEnum1779420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."outbound_integration_deliveries_delivery_attribute_category_enum" AS ENUM(
        'Ekspedisi Eksternal',
        'Ekspedisi Internal',
        'Ekspedisi Vendor'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "outbound_integration_deliveries"
      ALTER COLUMN "delivery_attribute_category" TYPE "public"."outbound_integration_deliveries_delivery_attribute_category_enum"
      USING "delivery_attribute_category"::"public"."outbound_integration_deliveries_delivery_attribute_category_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbound_integration_deliveries"
      ALTER COLUMN "delivery_attribute_category" TYPE character varying(150)
      USING "delivery_attribute_category"::text
    `);
    await queryRunner.query(
      `DROP TYPE "public"."outbound_integration_deliveries_delivery_attribute_category_enum"`,
    );
  }
}
