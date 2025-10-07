import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundDo1759807439568 implements MigrationInterface {
    name = 'OutboundDo1759807439568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_outbound_type_enum" AS ENUM('DELIVERY', 'PICKUP', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "outbound_do" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "outbound_do_number" character varying, "expedition" character varying, "origin" character varying, "license_plate" character varying, "driver_name" character varying, "driver_phone" character varying, "status" "public"."outbound_do_status_enum" DEFAULT 'PENDING', "outbound_type" "public"."outbound_do_outbound_type_enum", "delivery_date" TIMESTAMP, "memo_id" text, CONSTRAINT "UQ_e71ba8c3f6051f79bc4481ce296" UNIQUE ("outbound_do_number"), CONSTRAINT "PK_4ff70cae9833b5519c1c1a58307" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "outbound_do_memo" ("outbound_do_id" uuid NOT NULL, "outbound_memo_id" uuid NOT NULL, CONSTRAINT "PK_9aadd65f5f5e94c6ac027f98aa0" PRIMARY KEY ("outbound_do_id", "outbound_memo_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_37ebede21acb4ff951fec8f50c" ON "outbound_do_memo" ("outbound_do_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd7e61a46d1ba8bf9db9c835da" ON "outbound_do_memo" ("outbound_memo_id") `);
        await queryRunner.query(`ALTER TABLE "outbound_do_memo" ADD CONSTRAINT "FK_37ebede21acb4ff951fec8f50c9" FOREIGN KEY ("outbound_do_id") REFERENCES "outbound_do"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "outbound_do_memo" ADD CONSTRAINT "FK_fd7e61a46d1ba8bf9db9c835da1" FOREIGN KEY ("outbound_memo_id") REFERENCES "outbound_memo"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do_memo" DROP CONSTRAINT "FK_fd7e61a46d1ba8bf9db9c835da1"`);
        await queryRunner.query(`ALTER TABLE "outbound_do_memo" DROP CONSTRAINT "FK_37ebede21acb4ff951fec8f50c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd7e61a46d1ba8bf9db9c835da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37ebede21acb4ff951fec8f50c"`);
        await queryRunner.query(`DROP TABLE "outbound_do_memo"`);
        await queryRunner.query(`DROP TABLE "outbound_do"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_outbound_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_status_enum"`);
    }

}
