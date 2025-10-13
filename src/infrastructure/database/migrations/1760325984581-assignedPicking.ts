import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignedPicking1760325984581 implements MigrationInterface {
    name = 'AssignedPicking1760325984581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assigned_picking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "memo_id" uuid, "picking_user_id" character varying, "picking_name" character varying, "picking_phone" character varying, CONSTRAINT "PK_b56829c70167dc2b768df4459ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assigned_picking" ADD CONSTRAINT "FK_535246ee9aadc7b7f320f9ed699" FOREIGN KEY ("memo_id") REFERENCES "outbound_memo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_picking" DROP CONSTRAINT "FK_535246ee9aadc7b7f320f9ed699"`);
        await queryRunner.query(`DROP TABLE "assigned_picking"`);
    }

}
