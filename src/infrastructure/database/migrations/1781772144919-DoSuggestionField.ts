import { MigrationInterface, QueryRunner } from "typeorm";

export class DoSuggestionField1781772144919 implements MigrationInterface {
    name = 'DoSuggestionField1781772144919'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "spb_date" date`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "spb_number" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" ADD "line_number" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion_details" DROP COLUMN "line_number"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "spb_number"`);
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "spb_date"`);
    }

}
