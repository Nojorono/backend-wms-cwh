import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMovementType1769154327123 implements MigrationInterface {
    name = 'AddMovementType1769154327123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."inventory_movement_movement_type_enum" AS ENUM('GOOD_STOCK', 'BAD_STOCK')`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD "movement_type" "public"."inventory_movement_movement_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP COLUMN "movement_type"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movement_movement_type_enum"`);
    }

}
