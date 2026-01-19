import { MigrationInterface, QueryRunner } from "typeorm";

export class MovementLocationFix1765162627023 implements MigrationInterface {
    name = 'MovementLocationFix1765162627023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "assigned_user_name"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "assigned_user_id"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "moved_by"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "movement_date"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "movement_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "moved_by" character varying`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "assigned_user_id" character varying`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "assigned_user_name" character varying`);
    }

}
