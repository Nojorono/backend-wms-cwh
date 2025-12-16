import { MigrationInterface, QueryRunner } from "typeorm";

export class FlagMemoIdInPallet1765866696209 implements MigrationInterface {
    name = 'FlagMemoIdInPallet1765866696209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "memo_id" uuid`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD CONSTRAINT "FK_ff753ec24f48eac1196823b4fac" FOREIGN KEY ("memo_id") REFERENCES "outbound_memo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP CONSTRAINT "FK_ff753ec24f48eac1196823b4fac"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "memo_id"`);
    }

}
