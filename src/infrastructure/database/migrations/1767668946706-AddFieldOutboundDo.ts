import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldOutboundDo1767668946706 implements MigrationInterface {
    name = 'AddFieldOutboundDo1767668946706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "container_number" character varying`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "seal_number" character varying`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TYPE "public"."assigned_gate_status_enum" RENAME TO "assigned_gate_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."assigned_gate_status_enum" AS ENUM('PENDING', 'DONE', 'APPROVED')`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" TYPE "public"."assigned_gate_status_enum" USING "status"::"text"::"public"."assigned_gate_status_enum"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."assigned_gate_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assigned_gate_status_enum_old" AS ENUM('PENDING', 'DONE')`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" TYPE "public"."assigned_gate_status_enum_old" USING "status"::"text"::"public"."assigned_gate_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."assigned_gate_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."assigned_gate_status_enum_old" RENAME TO "assigned_gate_status_enum"`);
        await queryRunner.query(`ALTER TABLE "assigned_gate_load" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "seal_number"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "container_number"`);
    }

}
