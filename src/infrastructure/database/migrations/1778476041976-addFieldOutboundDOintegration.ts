import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldOutboundDOintegration1778476041976 implements MigrationInterface {
    name = 'AddFieldOutboundDOintegration1778476041976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" DROP CONSTRAINT "FK_outbound_ir_req_lines_header"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" ADD "outbound_do_id" uuid`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" ADD CONSTRAINT "FK_9a2ec192320be3a5c56001a57de" FOREIGN KEY ("outbound_do_id") REFERENCES "outbound_do"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" ADD CONSTRAINT "FK_4b23ee03cbe0b98050edabba325" FOREIGN KEY ("outbound_integration_ir_req_id") REFERENCES "outbound_integration_ir_req"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" DROP CONSTRAINT "FK_4b23ee03cbe0b98050edabba325"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" DROP CONSTRAINT "FK_9a2ec192320be3a5c56001a57de"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req" DROP COLUMN "outbound_do_id"`);
        await queryRunner.query(`ALTER TABLE "outbound_integration_ir_req_lines" ADD CONSTRAINT "FK_outbound_ir_req_lines_header" FOREIGN KEY ("outbound_integration_ir_req_id") REFERENCES "outbound_integration_ir_req"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
