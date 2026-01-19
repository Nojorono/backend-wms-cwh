import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPalletWeek1763542482117 implements MigrationInterface {
    name = 'FixPalletWeek1763542482117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" RENAME COLUMN "qr_image_url" TO "current_week_number"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "current_week_number"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "current_week_number" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "current_week_number"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "current_week_number" character varying`);
        await queryRunner.query(`ALTER TABLE "m_pallet" RENAME COLUMN "current_week_number" TO "qr_image_url"`);
    }

}
