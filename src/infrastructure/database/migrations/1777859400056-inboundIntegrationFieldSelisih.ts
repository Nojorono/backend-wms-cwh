import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundIntegrationFieldSelisih1777859400056 implements MigrationInterface {
    name = 'InboundIntegrationFieldSelisih1777859400056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD "receipt_number_selisih" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD "status_selisih" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" ADD "message_selisih" character varying(240)`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "quantity_selisih" bigint`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "subinventory_selisih" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "locator_id_selisih" bigint`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "status_selisih" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" ADD "message_selisih" character varying(240)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "message_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "status_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "locator_id_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "subinventory_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration_lines" DROP COLUMN "quantity_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP COLUMN "message_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP COLUMN "status_selisih"`);
        await queryRunner.query(`ALTER TABLE "inbound_integration" DROP COLUMN "receipt_number_selisih"`);
    }

}
