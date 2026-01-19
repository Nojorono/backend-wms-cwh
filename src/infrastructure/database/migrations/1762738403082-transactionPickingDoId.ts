import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionPickingDoId1762738403082 implements MigrationInterface {
    name = 'TransactionPickingDoId1762738403082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "do_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_c14db72dab4f48560ded88e1765" FOREIGN KEY ("do_id") REFERENCES "outbound_do"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_c14db72dab4f48560ded88e1765"`);
        await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "do_id"`);
    }

}
