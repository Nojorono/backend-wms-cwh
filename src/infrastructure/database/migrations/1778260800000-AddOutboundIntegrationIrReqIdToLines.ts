import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOutboundIntegrationIrReqIdToLines1778260800000 implements MigrationInterface {
  name = 'AddOutboundIntegrationIrReqIdToLines1778260800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbound_integration_ir_req_lines" ADD "outbound_integration_ir_req_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbound_integration_ir_req_lines" ADD CONSTRAINT "FK_outbound_ir_req_lines_header" FOREIGN KEY ("outbound_integration_ir_req_id") REFERENCES "outbound_integration_ir_req"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbound_integration_ir_req_lines" DROP CONSTRAINT "FK_outbound_ir_req_lines_header"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbound_integration_ir_req_lines" DROP COLUMN "outbound_integration_ir_req_id"`,
    );
  }
}
