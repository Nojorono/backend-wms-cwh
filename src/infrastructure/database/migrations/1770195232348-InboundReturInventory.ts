import { MigrationInterface, QueryRunner } from "typeorm";

export class InboundReturInventory1770195232348 implements MigrationInterface {
    name = 'InboundReturInventory1770195232348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_tracking" DROP CONSTRAINT "FK_7759d8976196cd2ac908cca7412"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" DROP COLUMN "inventory_tracking_bad_id"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" ADD "inventory_tracking_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" ADD CONSTRAINT "FK_ab87947e95c96d7a738e92c98ff" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" DROP CONSTRAINT "FK_ab87947e95c96d7a738e92c98ff"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking_bad" DROP COLUMN "inventory_tracking_id"`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" ADD "inventory_tracking_bad_id" uuid`);
        await queryRunner.query(`ALTER TABLE "inventory_tracking" ADD CONSTRAINT "FK_7759d8976196cd2ac908cca7412" FOREIGN KEY ("inventory_tracking_bad_id") REFERENCES "inventory_tracking_bad"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
