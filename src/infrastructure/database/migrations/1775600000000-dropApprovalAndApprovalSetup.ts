import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropApprovalAndApprovalSetup1775600000000 implements MigrationInterface {
  name = 'DropApprovalAndApprovalSetup1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "stock_adjustment_approval" DROP CONSTRAINT IF EXISTS "FK_49f0dc744709ea682ab9b3de844"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "approval_level" DROP CONSTRAINT IF EXISTS "FK_0b7159734d269164f9fc92d21e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "approval" DROP CONSTRAINT IF EXISTS "FK_c2b96d7993070ca6c5730ae7618"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "approval"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "approval_setup"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."approval_entity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."approval_setup_entity_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."approval_setup_entity_type_enum" AS ENUM('STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "approval_setup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying, "description" character varying, "entity_type" "public"."approval_setup_entity_type_enum", "is_active" boolean DEFAULT true, "require_all_levels" boolean DEFAULT false, "total_levels" integer DEFAULT '0', CONSTRAINT "PK_d88071cdd09b5e046c57fab4bee" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."approval_entity_type_enum" AS ENUM('STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_APPROVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "approval" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "entity_type" "public"."approval_entity_type_enum", "entity_id" character varying, "entity_data" jsonb, "approval_setup_id" uuid, "status" "public"."approval_status_enum" DEFAULT 'PENDING', "current_level" integer, "requested_by" character varying, "reason" character varying, "notes" character varying, "approval_history" jsonb, "rejected_by" character varying, "rejected_at" TIMESTAMP, "rejection_reason" character varying, "cancelled_by" character varying, "cancelled_at" TIMESTAMP, "cancellation_reason" character varying, CONSTRAINT "PK_97bfd1cd9dff3c1302229da6b5c" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "approval" ADD CONSTRAINT "FK_c2b96d7993070ca6c5730ae7618" FOREIGN KEY ("approval_setup_id") REFERENCES "approval_setup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

