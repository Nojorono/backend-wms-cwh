import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldOutboundDestinationId1778260713562 implements MigrationInterface {
    name = 'AddFieldOutboundDestinationId1778260713562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD "destination_io_id" uuid`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD CONSTRAINT "FK_4b577e133437c1e1a6b088c4b6b" FOREIGN KEY ("destination_io_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP CONSTRAINT "FK_4b577e133437c1e1a6b088c4b6b"`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP COLUMN "destination_io_id"`);
    }

}
