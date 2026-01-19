import { MigrationInterface, QueryRunner } from "typeorm";

export class MovementLocationUser1765164479745 implements MigrationInterface {
    name = 'MovementLocationUser1765164479745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "movement_number" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "movement_number"`);
    }

}
