import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryMovementOrgId1778139386231 implements MigrationInterface {
    name = 'InventoryMovementOrgId1778139386231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "organization_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_3f006db7c2e706e0e3fa763f3e4" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_3f006db7c2e706e0e3fa763f3e4"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "organization_id"`);
    }

}
