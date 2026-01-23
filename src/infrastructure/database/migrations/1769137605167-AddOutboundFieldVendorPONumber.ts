import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutboundFieldVendorPONumber1769137605167 implements MigrationInterface {
    name = 'AddOutboundFieldVendorPONumber1769137605167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "vendor_po_number" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "vendor_po_number"`);
    }

}
