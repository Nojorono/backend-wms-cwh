import { MigrationInterface, QueryRunner } from "typeorm";

export class DepartementInDetail1780882045621 implements MigrationInterface {
    name = 'DepartementInDetail1780882045621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" ADD "departement_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_62a02095feb7bf4d7cc1a29e503" FOREIGN KEY ("departement_id") REFERENCES "m_departement"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_62a02095feb7bf4d7cc1a29e503"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "departement_id"`);
    }

}
