import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOutboundDoTypeEnum1759975480790 implements MigrationInterface {
    name = 'FixOutboundDoTypeEnum1759975480790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."outbound_do_outbound_type_enum" RENAME TO "outbound_do_outbound_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_outbound_type_enum" AS ENUM('SUBDIST', 'AMO')`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "outbound_type" TYPE "public"."outbound_do_outbound_type_enum" USING "outbound_type"::"text"::"public"."outbound_do_outbound_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_outbound_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`CREATE TYPE "public"."outbound_do_outbound_type_enum_old" AS ENUM('DELIVERY', 'PICKUP', 'TRANSFER')`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ALTER COLUMN "outbound_type" TYPE "public"."outbound_do_outbound_type_enum_old" USING "outbound_type"::"text"::"public"."outbound_do_outbound_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_do_outbound_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."outbound_do_outbound_type_enum_old" RENAME TO "outbound_do_outbound_type_enum"`);
    }

}
