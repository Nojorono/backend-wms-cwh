import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveOrderIntegrationFields1781841000000 implements MigrationInterface {
  name = 'MoveOrderIntegrationFields1781841000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "move_order_integration" ALTER COLUMN "request_number" TYPE character varying(100) USING "request_number"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_integration" ADD "total_lines" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_line_integration" ADD "move_order_integration_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_line_integration" ADD CONSTRAINT "FK_move_order_line_integration_header" FOREIGN KEY ("move_order_integration_id") REFERENCES "move_order_integration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "move_order_line_integration" DROP CONSTRAINT "FK_move_order_line_integration_header"`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_line_integration" DROP COLUMN "move_order_integration_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_integration" DROP COLUMN "total_lines"`,
    );
    await queryRunner.query(
      `ALTER TABLE "move_order_integration" ALTER COLUMN "request_number" TYPE bigint USING NULLIF(regexp_replace("request_number", '[^0-9]', '', 'g'), '')::bigint`,
    );
  }
}
