import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldTransactionPickingScan1762930693217 implements MigrationInterface {
    name = 'AddFieldTransactionPickingScan1762930693217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD "item_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" ADD CONSTRAINT "FK_e948d647fac624390f2e592a54a" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP CONSTRAINT "FK_e948d647fac624390f2e592a54a"`);
        await queryRunner.query(`ALTER TABLE "transaction_scan_picking" DROP COLUMN "item_id"`);
    }

}
