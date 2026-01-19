import { MigrationInterface, QueryRunner } from "typeorm";

export class Auditlog1764133477971 implements MigrationInterface {
    name = 'Auditlog1764133477971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_activity_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'CANCEL', 'DOWNLOAD', 'UPLOAD', 'SEARCH', 'FILTER', 'CUSTOM')`);
        await queryRunner.query(`CREATE TYPE "public"."users_activity_status_enum" AS ENUM('SUCCESS', 'FAILED', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "users_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" character varying, "username" character varying, "action" "public"."users_activity_action_enum" NOT NULL, "entity_type" character varying, "entity_id" character varying, "description" text, "request_data" jsonb, "response_data" jsonb, "metadata" jsonb, "ip_address" character varying, "user_agent" text, "status" "public"."users_activity_status_enum" NOT NULL DEFAULT 'SUCCESS', "error_message" text, "endpoint" character varying, "method" character varying, "response_time_ms" integer, "organization_id" character varying, "warehouse_id" character varying, CONSTRAINT "PK_d9ff41d132a403e1d6bba6dac13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2a8a975347ccaf53d13ce4dbb5" ON "users_activity" ("ip_address") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f6154c3c1866eebe9fdd0a50b" ON "users_activity" ("status", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d1714866efd957b252ab33de7" ON "users_activity" ("action", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_50b785040ad0dfa8734e0c71cf" ON "users_activity" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b6812bec4e6b518fd3b7a8258e" ON "users_activity" ("user_id", "created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b6812bec4e6b518fd3b7a8258e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_50b785040ad0dfa8734e0c71cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d1714866efd957b252ab33de7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f6154c3c1866eebe9fdd0a50b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2a8a975347ccaf53d13ce4dbb5"`);
        await queryRunner.query(`DROP TABLE "users_activity"`);
        await queryRunner.query(`DROP TYPE "public"."users_activity_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_activity_action_enum"`);
    }

}
