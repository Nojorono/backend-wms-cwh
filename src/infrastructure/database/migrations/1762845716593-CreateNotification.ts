import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotification1762845716593 implements MigrationInterface {
    name = 'CreateNotification1762845716593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_history_status_enum" AS ENUM('SENT', 'DELIVERED', 'READ', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "notification_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" character varying, "title" character varying, "message" text, "priority" character varying, "entity_id" character varying, "entity_type" character varying, "metadata" jsonb, "user_id" character varying, "username" character varying, "rooms" text, "recipients" text, "status" "public"."notification_history_status_enum" NOT NULL DEFAULT 'SENT', "sent_at" TIMESTAMP, "delivered_at" TIMESTAMP, "read_at" TIMESTAMP, "read_by" character varying, "error_message" text, "is_broadcast" boolean NOT NULL DEFAULT false, "organization_id" character varying, "warehouse_id" character varying, CONSTRAINT "PK_901f37d36fcc63dffdc1281d6bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a4ae09a0857e45b2309c36099" ON "notification_history" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_022b55751fd7c86ab78b9be257" ON "notification_history" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7934bceba4c8503e3d87e18eb6" ON "notification_history" ("type", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_65bb163f315f8bc642a706db6a" ON "notification_history" ("user_id", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_65bb163f315f8bc642a706db6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7934bceba4c8503e3d87e18eb6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_022b55751fd7c86ab78b9be257"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a4ae09a0857e45b2309c36099"`);
        await queryRunner.query(`DROP TABLE "notification_history"`);
        await queryRunner.query(`DROP TYPE "public"."notification_history_status_enum"`);
    }

}
