import { MigrationInterface, QueryRunner } from "typeorm";

export class WarehouseSubUserDetail1777450678414 implements MigrationInterface {
    name = 'WarehouseSubUserDetail1777450678414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" ADD "warehouse_sub_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_2635ba372592e04b7d04a4cedac" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_2635ba372592e04b7d04a4cedac"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "warehouse_sub_id"`);
    }

}
