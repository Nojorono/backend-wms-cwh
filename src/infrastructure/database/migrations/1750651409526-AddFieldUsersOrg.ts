import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldUsersOrg1750651409526 implements MigrationInterface {
    name = 'AddFieldUsersOrg1750651409526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "organization_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organization_id"`);
    }

}
