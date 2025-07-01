import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInboundTrans1751337302849 implements MigrationInterface {
    name = 'AddFieldInboundTrans1751337302849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "arrival_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "departure_date" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "departure_date"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "arrival_date"`);
    }

}
