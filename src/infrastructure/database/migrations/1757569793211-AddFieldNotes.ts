import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldNotes1757569793211 implements MigrationInterface {
    name = 'AddFieldNotes1757569793211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" ADD "notes" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "notes"`);
    }

}
