import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionScanInboundDateProd1757580858712 implements MigrationInterface {
    name = 'TransactionScanInboundDateProd1757580858712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" ADD "production_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_inbound" DROP COLUMN "production_date"`);
    }

}
