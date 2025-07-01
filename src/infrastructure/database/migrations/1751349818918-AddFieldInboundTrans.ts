import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldInboundTrans1751349818918 implements MigrationInterface {
    name = 'AddFieldInboundTrans1751349818918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "transporter_seal_number" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "transporter_seal_number"`);
    }

}
