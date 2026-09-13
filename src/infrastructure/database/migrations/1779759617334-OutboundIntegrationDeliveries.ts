import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundIntegrationDeliveries1779759617334 implements MigrationInterface {
    name = 'OutboundIntegrationDeliveries1779759617334'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "qty_utilitas" bigint`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."outbound_do_type_calculation_enum" AS ENUM('MULTIDROP', 'SINGLEDROP'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "type_calculation" "public"."outbound_do_type_calculation_enum"`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."outbound_do_delivery_category_enum" AS ENUM('Ekspedisi Eksternal', 'Ekspedisi Internal', 'Ekspedisi Vendor'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "delivery_category" "public"."outbound_do_delivery_category_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" DROP COLUMN "delivery_attribute_category"`);
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."outbound_integration_deliveries_delivery_attribute_category_enum" AS ENUM('Ekspedisi Eksternal', 'Ekspedisi Internal', 'Ekspedisi Vendor'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" ADD "delivery_attribute_category" "public"."outbound_integration_deliveries_delivery_attribute_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" DROP COLUMN "delivery_attribute_category"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_integration_deliveries_delivery_attribute_category_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_deliveries" ADD "delivery_attribute_category" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "delivery_category"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_delivery_category_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "type_calculation"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_type_calculation_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "qty_utilitas"`);
    }

}
