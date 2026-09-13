import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveOrderFieldFix1782095239860 implements MigrationInterface {
    name = 'MoveOrderFieldFix1782095239860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "move_order_line_integration" DROP CONSTRAINT "FK_move_order_line_integration_header"`);
        await queryRunner.query(`ALTER TABLE "move_order_integration" ADD "master_io_id" uuid`);
        await queryRunner.query(`ALTER TABLE "move_order_line_integration" ADD CONSTRAINT "FK_44c93bf1e7a8315908fadbdf6d9" FOREIGN KEY ("move_order_integration_id") REFERENCES "move_order_integration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "move_order_integration" ADD CONSTRAINT "FK_4b8273c21b7cd55f9d361802862" FOREIGN KEY ("master_io_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "move_order_integration" DROP CONSTRAINT "FK_4b8273c21b7cd55f9d361802862"`);
        await queryRunner.query(`ALTER TABLE "move_order_line_integration" DROP CONSTRAINT "FK_44c93bf1e7a8315908fadbdf6d9"`);
        await queryRunner.query(`ALTER TABLE "move_order_integration" DROP COLUMN "master_io_id"`);
        await queryRunner.query(`ALTER TABLE "move_order_line_integration" ADD CONSTRAINT "FK_move_order_line_integration_header" FOREIGN KEY ("move_order_integration_id") REFERENCES "move_order_integration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
