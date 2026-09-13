import { MigrationInterface, QueryRunner } from "typeorm";

export class FixingFieldDOAndOnHand1782045434694 implements MigrationInterface {
    name = 'FixingFieldDOAndOnHand1782045434694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "on_hand_atr" ADD "total_submitted" integer`);
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" ADD "item_qty_submitted" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" DROP COLUMN "item_qty_submitted"`);
        await queryRunner.query(`ALTER TABLE "on_hand_atr" DROP COLUMN "total_submitted"`);
    }

}
