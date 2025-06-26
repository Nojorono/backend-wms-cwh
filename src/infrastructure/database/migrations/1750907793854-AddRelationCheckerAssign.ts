import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationCheckerAssign1750907793854 implements MigrationInterface {
    name = 'AddRelationCheckerAssign1750907793854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_assign" DROP COLUMN "inbound_plan_id"`);
        await queryRunner.query(`ALTER TABLE "checker_assign" ADD "inbound_plan_id" uuid`);
        await queryRunner.query(`ALTER TABLE "checker_assign" ADD CONSTRAINT "FK_bd5be1e3c68daeed27620ce0504" FOREIGN KEY ("inbound_plan_id") REFERENCES "inbound_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "checker_assign" DROP CONSTRAINT "FK_bd5be1e3c68daeed27620ce0504"`);
        await queryRunner.query(`ALTER TABLE "checker_assign" DROP COLUMN "inbound_plan_id"`);
        await queryRunner.query(`ALTER TABLE "checker_assign" ADD "inbound_plan_id" character varying`);
    }

}
