import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundDoAddToReceipt1778118682162 implements MigrationInterface {
    name = 'InboundDoAddToReceipt1778118682162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_do" ADD "add_to_receipt_number" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "add_to_receipt_number"`);
    }

}
