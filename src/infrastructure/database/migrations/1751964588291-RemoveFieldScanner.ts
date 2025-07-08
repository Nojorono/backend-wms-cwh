import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFieldScanner1751964588291 implements MigrationInterface {
    name = 'RemoveFieldScanner1751964588291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP CONSTRAINT "FK_e238767ed65a475f55d388b6335"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" DROP COLUMN "inbound_plan_item_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "inbound_plan_item_id" uuid`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "created_by" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD "updated_by" character varying`);
        await queryRunner.query(`ALTER TABLE "checker_scanning" ADD CONSTRAINT "FK_e238767ed65a475f55d388b6335" FOREIGN KEY ("inbound_plan_item_id") REFERENCES "inbound_plan_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
