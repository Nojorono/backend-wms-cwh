import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMoveOrder1763368609935 implements MigrationInterface {
    name = 'CreateMoveOrder1763368609935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "move_order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "move_order_id" uuid, "item_id" uuid, "production_date" TIMESTAMP, "week_number" integer, "pallet_id" uuid, "quantity" integer, "uom" character varying, CONSTRAINT "PK_82917f3c368af010960342c8df4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."move_order_move_order_status_enum" AS ENUM('PENDING', 'CREATED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "move_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "move_order_number" character varying, "move_order_type" character varying, "move_order_status" "public"."move_order_move_order_status_enum" DEFAULT 'CREATED', CONSTRAINT "PK_1271bc95bf26c17902ec3b1ba95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "move_order_item" ADD CONSTRAINT "FK_e8f880a8d46eba6568bd641a22e" FOREIGN KEY ("move_order_id") REFERENCES "move_order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "move_order_item" ADD CONSTRAINT "FK_1358785c0e13ee717c957582d17" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "move_order_item" ADD CONSTRAINT "FK_2d43847dcb0ea6a8661bed6882c" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "move_order_item" DROP CONSTRAINT "FK_2d43847dcb0ea6a8661bed6882c"`);
        await queryRunner.query(`ALTER TABLE "move_order_item" DROP CONSTRAINT "FK_1358785c0e13ee717c957582d17"`);
        await queryRunner.query(`ALTER TABLE "move_order_item" DROP CONSTRAINT "FK_e8f880a8d46eba6568bd641a22e"`);
        await queryRunner.query(`DROP TABLE "move_order"`);
        await queryRunner.query(`DROP TYPE "public"."move_order_move_order_status_enum"`);
        await queryRunner.query(`DROP TABLE "move_order_item"`);
    }

}
