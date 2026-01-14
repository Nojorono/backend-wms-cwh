import { MigrationInterface, QueryRunner } from "typeorm";

export class EnumOutboundDo1768356238778 implements MigrationInterface {
    name = 'EnumOutboundDo1768356238778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."outbound_do_status_enum" RENAME TO "outbound_do_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'CANCELLED', 'APPROVED_LOADED')`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" TYPE "public"."outbound_do_status_enum" USING "status"::"text"::"public"."outbound_do_status_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_status_enum_old" AS ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" TYPE "public"."outbound_do_status_enum_old" USING "status"::"text"::"public"."outbound_do_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."outbound_do_status_enum_old" RENAME TO "outbound_do_status_enum"`);
    }

}
