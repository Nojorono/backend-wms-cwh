import { MigrationInterface, QueryRunner } from "typeorm";

export class MemoHasDo1762744584592 implements MigrationInterface {
    name = 'MemoHasDo1762744584592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD "has_do" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP COLUMN "has_do"`);
    }

}
