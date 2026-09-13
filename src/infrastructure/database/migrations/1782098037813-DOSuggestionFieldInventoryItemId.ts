import { MigrationInterface, QueryRunner } from "typeorm";

export class DOSuggestionFieldInventoryItemId1782098037813 implements MigrationInterface {
    name = 'DOSuggestionFieldInventoryItemId1782098037813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" ADD "inventory_item_id" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" DROP COLUMN "inventory_item_id"`);
    }

}
