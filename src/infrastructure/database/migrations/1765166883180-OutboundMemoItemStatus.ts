import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundMemoItemStatus1765166883180 implements MigrationInterface {
    name = 'OutboundMemoItemStatus1765166883180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."outbound_memo_item_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" ADD "status" "public"."outbound_memo_item_status_enum" DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo_item" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."outbound_memo_item_status_enum"`);
    }

}
