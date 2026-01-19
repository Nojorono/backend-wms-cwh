import { MigrationInterface, QueryRunner } from "typeorm";

export class MasterWarehouseSubFlagGate1765178696716 implements MigrationInterface {
    name = 'MasterWarehouseSubFlagGate1765178696716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "is_gate" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "is_gate"`);
    }

}
