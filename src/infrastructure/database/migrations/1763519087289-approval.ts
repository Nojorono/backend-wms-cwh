import { MigrationInterface, QueryRunner } from "typeorm";

export class Approval1763519087289 implements MigrationInterface {
    name = 'Approval1763519087289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "approval_level" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "approval_setup_id" uuid, "level" integer, "level_name" character varying, "description" character varying, "role_id" integer, "is_required" boolean DEFAULT true, "can_skip" boolean DEFAULT false, "min_approvers" integer, "max_approvers" integer, "required_approvers" integer DEFAULT '1', "order" integer DEFAULT '0', CONSTRAINT "PK_3372e2ec91810c6d9933001759c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_02d96eabfa7883e00d895ea7df" ON "approval_level" ("approval_setup_id", "level") `);
        await queryRunner.query(`CREATE TYPE "public"."approval_setup_entity_type_enum" AS ENUM('STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM')`);
        await queryRunner.query(`CREATE TABLE "approval_setup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying, "description" character varying, "entity_type" "public"."approval_setup_entity_type_enum", "is_active" boolean DEFAULT true, "require_all_levels" boolean DEFAULT false, "total_levels" integer DEFAULT '0', CONSTRAINT "PK_d88071cdd09b5e046c57fab4bee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."approval_entity_type_enum" AS ENUM('STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM')`);
        await queryRunner.query(`CREATE TYPE "public"."approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_APPROVED')`);
        await queryRunner.query(`CREATE TABLE "approval" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "entity_type" "public"."approval_entity_type_enum", "entity_id" character varying, "entity_data" jsonb, "approval_setup_id" uuid, "status" "public"."approval_status_enum" DEFAULT 'PENDING', "current_level" integer, "requested_by" character varying, "reason" character varying, "notes" character varying, "approval_history" jsonb, "rejected_by" character varying, "rejected_at" TIMESTAMP, "rejection_reason" character varying, "cancelled_by" character varying, "cancelled_at" TIMESTAMP, "cancellation_reason" character varying, CONSTRAINT "PK_97bfd1cd9dff3c1302229da6b5c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "rejected_at"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."stock_adjustment_approval_status_enum"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "rejected_by"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "rejection_reason"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "reason"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "approved_by"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "requested_by"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "approved_at"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "approval_id" uuid`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "UQ_49f0dc744709ea682ab9b3de844" UNIQUE ("approval_id")`);
        await queryRunner.query(`ALTER TABLE "approval_level" ADD CONSTRAINT "FK_0b7159734d269164f9fc92d21e0" FOREIGN KEY ("approval_setup_id") REFERENCES "approval_setup"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_level" ADD CONSTRAINT "FK_093d45e282056eabc010d7488a8" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval" ADD CONSTRAINT "FK_c2b96d7993070ca6c5730ae7618" FOREIGN KEY ("approval_setup_id") REFERENCES "approval_setup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD CONSTRAINT "FK_49f0dc744709ea682ab9b3de844" FOREIGN KEY ("approval_id") REFERENCES "approval"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT "FK_49f0dc744709ea682ab9b3de844"`);
        await queryRunner.query(`ALTER TABLE "approval" DROP CONSTRAINT "FK_c2b96d7993070ca6c5730ae7618"`);
        await queryRunner.query(`ALTER TABLE "approval_level" DROP CONSTRAINT "FK_093d45e282056eabc010d7488a8"`);
        await queryRunner.query(`ALTER TABLE "approval_level" DROP CONSTRAINT "FK_0b7159734d269164f9fc92d21e0"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP CONSTRAINT "UQ_49f0dc744709ea682ab9b3de844"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" DROP COLUMN "approval_id"`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "approved_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "requested_by" character varying`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "approved_by" character varying`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "reason" character varying`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "rejection_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "rejected_by" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."stock_adjustment_approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "status" "public"."stock_adjustment_approval_status_enum" DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "stock_adjustment_approval" ADD "rejected_at" TIMESTAMP`);
        await queryRunner.query(`DROP TABLE "approval"`);
        await queryRunner.query(`DROP TYPE "public"."approval_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."approval_entity_type_enum"`);
        await queryRunner.query(`DROP TABLE "approval_setup"`);
        await queryRunner.query(`DROP TYPE "public"."approval_setup_entity_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02d96eabfa7883e00d895ea7df"`);
        await queryRunner.query(`DROP TABLE "approval_level"`);
    }

}
