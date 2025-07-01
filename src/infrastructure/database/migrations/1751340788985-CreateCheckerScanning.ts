import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCheckerScanning1751340788985 implements MigrationInterface {
    name = 'CreateCheckerScanning1751340788985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "checker_scanning" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "checker_assign_id" character varying, "actual_qty" numeric(10,2) NOT NULL, "pallet_code" character varying, "scanning_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "inbound_plan_item_id" uuid, "checker_id" uuid, CONSTRAINT "PK_5c7bb118918577f9926a4abe033" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD CONSTRAINT "FK_e238767ed65a475f55d388b6335" FOREIGN KEY ("inbound_plan_item_id") REFERENCES "inbound_plan_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD CONSTRAINT "FK_603ce1c38aa257672a02b2c1b44" FOREIGN KEY ("checker_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP CONSTRAINT "FK_603ce1c38aa257672a02b2c1b44"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP CONSTRAINT "FK_e238767ed65a475f55d388b6335"`);
        await queryRunner.query(`DROP TABLE "checker_scanning"`);
    }

}
