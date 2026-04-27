import { MigrationInterface, QueryRunner } from "typeorm";

export class PutAwayIoId1777264477663 implements MigrationInterface {
    name = 'PutAwayIoId1777264477663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD CONSTRAINT "FK_186a4c18775a1bb7f80084cc898" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP CONSTRAINT "FK_186a4c18775a1bb7f80084cc898"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "organization_id"`);
    }

}
