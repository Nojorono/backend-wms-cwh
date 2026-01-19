import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIsGoodStock1763348150944 implements MigrationInterface {
    name = 'CreateIsGoodStock1763348150944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" ADD "is_good_stock" boolean DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_sub" DROP COLUMN "is_good_stock"`);
    }

}
