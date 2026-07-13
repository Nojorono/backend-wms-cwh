import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundDOField1783914749731 implements MigrationInterface {
    name = 'OutboundDOField1783914749731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "subdist_document" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "subdist_document"`);
    }

}
