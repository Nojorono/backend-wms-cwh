import { MigrationInterface, QueryRunner } from "typeorm";

export class UserDetailfield1775524950105 implements MigrationInterface {
    name = 'UserDetailfield1775524950105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" ADD "firstName" character varying`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "lastName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "firstName"`);
    }

}
