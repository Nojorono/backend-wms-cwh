import { MigrationInterface, QueryRunner } from "typeorm";

export class DoSuggestionFieldSpvNik1781774896484 implements MigrationInterface {
    name = 'DoSuggestionFieldSpvNik1781774896484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion" ADD "sales_spv_nik" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "do_suggestion" DROP COLUMN "sales_spv_nik"`);
    }

}
