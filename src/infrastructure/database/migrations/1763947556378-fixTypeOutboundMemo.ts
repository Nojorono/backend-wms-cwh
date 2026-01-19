import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTypeOutboundMemo1763947556378 implements MigrationInterface {
    name = 'FixTypeOutboundMemo1763947556378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD "type" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP COLUMN "type"`);
    }

}
