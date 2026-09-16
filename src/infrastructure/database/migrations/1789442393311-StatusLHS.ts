import { MigrationInterface, QueryRunner } from "typeorm";

export class StatusLHS1789442393311 implements MigrationInterface {
    name = 'StatusLHS1789442393311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "on_hand_atr" RENAME COLUMN "total_submitted" TO "status"`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" ADD "status" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "on_hand_atr" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" ADD "status" integer`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" RENAME COLUMN "status" TO "total_submitted"`);
    }

}
