import { MigrationInterface, QueryRunner } from "typeorm";

export class DoSuggestionFieldVoid1785829937652 implements MigrationInterface {
    name = 'DoSuggestionFieldVoid1785829937652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" ADD "item_qty_void" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" DROP COLUMN "item_qty_void"`);
    }

}
