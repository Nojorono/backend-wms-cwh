import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInboundId1760668595588 implements MigrationInterface {
    name = 'AddFieldInboundId1760668595588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ADD "inbound_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" DROP COLUMN "inbound_id"`);
    }

}
