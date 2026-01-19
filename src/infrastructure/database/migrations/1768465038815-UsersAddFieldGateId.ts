import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersAddFieldGateId1768465038815 implements MigrationInterface {
    name = 'UsersAddFieldGateId1768465038815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_detail_id"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "warehouse_sub_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_8ee6c4e464e4375b3b323963745"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef1a1915f99bcf7a87049f7449"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "UQ_ef1a1915f99bcf7a87049f74494" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "employee_id" character varying`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "user_details" ALTER COLUMN "organization_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ef1a1915f99bcf7a87049f7449" ON "user_details" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_ef1a1915f99bcf7a87049f74494" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_8ee6c4e464e4375b3b323963745" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_2635ba372592e04b7d04a4cedac" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_2635ba372592e04b7d04a4cedac"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_8ee6c4e464e4375b3b323963745"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "FK_ef1a1915f99bcf7a87049f74494"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef1a1915f99bcf7a87049f7449"`);
        await queryRunner.query(`ALTER TABLE "user_details" ALTER COLUMN "organization_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "phone" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "employee_id"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "employee_id" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP CONSTRAINT "UQ_ef1a1915f99bcf7a87049f74494"`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_details" ADD "user_id" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ef1a1915f99bcf7a87049f7449" ON "user_details" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_details" ADD CONSTRAINT "FK_8ee6c4e464e4375b3b323963745" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_details" DROP COLUMN "warehouse_sub_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "user_detail_id" character varying`);
    }

}
