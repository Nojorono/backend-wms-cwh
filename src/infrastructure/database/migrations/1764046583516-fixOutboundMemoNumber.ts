import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOutboundMemoNumber1764046583516 implements MigrationInterface {
    name = 'FixOutboundMemoNumber1764046583516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD "outbound_memo_number" character varying`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD CONSTRAINT "UQ_6b86cb4764b44b7eb1d6c6b76fb" UNIQUE ("outbound_memo_number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP CONSTRAINT "UQ_6b86cb4764b44b7eb1d6c6b76fb"`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP COLUMN "outbound_memo_number"`);
    }

}
