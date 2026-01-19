import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldTransactionPickingScan1763106159769 implements MigrationInterface {
    name = 'AddFieldTransactionPickingScan1763106159769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD "user_id" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD "user_name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP COLUMN "user_name"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP COLUMN "user_id"`);
    }

}
