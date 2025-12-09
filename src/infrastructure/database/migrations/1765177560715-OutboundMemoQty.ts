import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundMemoQty1765177560715 implements MigrationInterface {
    name = 'OutboundMemoQty1765177560715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add quantity_delivered column
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ADD "quantity_delivered" integer`);
        
        // Drop default before changing type
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" DROP DEFAULT`);
        
        // Convert column to text temporarily to allow value updates
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" TYPE text USING "status"::text`);
        
        // Update existing status values to match new enum
        // Convert PENDING and APPROVED to PROCESS (active status)
        await queryRunner.query(`UPDATE "outbound_memo_item" SET "status" = 'PROCESS' WHERE "status" IN ('PENDING', 'APPROVED')`);
        
        // Rename old enum type
        await queryRunner.query(`ALTER TYPE "public"."outbound_memo_item_status_enum" RENAME TO "outbound_memo_item_status_enum_old"`);
        
        // Create new enum type with only PROCESS and REJECTED
        await queryRunner.query(`CREATE TYPE "public"."outbound_memo_item_status_enum" AS ENUM('PROCESS', 'REJECTED')`);
        
        // Change column type from text to new enum
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" TYPE "public"."outbound_memo_item_status_enum" USING "status"::"public"."outbound_memo_item_status_enum"`);
        
        // Set new default
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" SET DEFAULT 'PROCESS'`);
        
        // Drop old enum type
        await queryRunner.query(`DROP TYPE "public"."outbound_memo_item_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbound_memo_item_status_enum_old" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" TYPE "public"."outbound_memo_item_status_enum_old" USING "status"::"text"::"public"."outbound_memo_item_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."outbound_memo_item_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."outbound_memo_item_status_enum_old" RENAME TO "outbound_memo_item_status_enum"`);
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" DROP COLUMN "quantity_delivered"`);
    }

}
