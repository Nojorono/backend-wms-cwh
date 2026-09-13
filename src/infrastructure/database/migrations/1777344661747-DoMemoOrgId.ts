import { MigrationInterface, QueryRunner } from "typeorm";

export class DoMemoOrgId1777344661747 implements MigrationInterface {
    name = 'DoMemoOrgId1777344661747'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "outbound_do" ADD CONSTRAINT "FK_d81025bda9df6898b21ea0b40c2" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" ADD CONSTRAINT "FK_eddb176eec9bff75899f4c93f89" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP CONSTRAINT "FK_eddb176eec9bff75899f4c93f89"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP CONSTRAINT "FK_d81025bda9df6898b21ea0b40c2"`);
        await queryRunner.query(`ALTER TABLE "outbound_memo" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "organization_id"`);
    }

}
