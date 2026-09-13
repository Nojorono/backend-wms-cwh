import { MigrationInterface, QueryRunner } from "typeorm";

export class OutboundDoAddField1768961068635 implements MigrationInterface {
    name = 'OutboundDoAddField1768961068635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "vendor_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "vendor_id"`);
    }

}
