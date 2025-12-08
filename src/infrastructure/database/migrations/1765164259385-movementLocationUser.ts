import { MigrationInterface, QueryRunner } from "typeorm";

export class MovementLocationUser1765164259385 implements MigrationInterface {
    name = 'MovementLocationUser1765164259385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_movement_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "inventory_movement_id" uuid, "user_id" uuid, "user_name" character varying, "user_phone" character varying, CONSTRAINT "PK_05b38e90147378e35516b9fd63b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_users" ADD CONSTRAINT "FK_552fd2a4493aeafa5788a237b98" FOREIGN KEY ("inventory_movement_id") REFERENCES "inventory_movement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_users" ADD CONSTRAINT "FK_b59773f57a0f932b7f643d14614" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement_users" DROP CONSTRAINT "FK_b59773f57a0f932b7f643d14614"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_users" DROP CONSTRAINT "FK_552fd2a4493aeafa5788a237b98"`);
        await queryRunner.query(`DROP TABLE "inventory_movement_users"`);
    }

}
