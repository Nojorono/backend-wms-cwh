import { MigrationInterface, QueryRunner } from "typeorm";

export class PalletUpdateOrgId1777427890642 implements MigrationInterface {
    name = 'PalletUpdateOrgId1777427890642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pallet_update" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "pallet_update" ADD CONSTRAINT "FK_80deeb71f71d1d649f44e56a435" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pallet_update" DROP CONSTRAINT "FK_80deeb71f71d1d649f44e56a435"`);
        await queryRunner.query(`ALTER TABLE "pallet_update" DROP COLUMN "organization_id"`);
    }

}
