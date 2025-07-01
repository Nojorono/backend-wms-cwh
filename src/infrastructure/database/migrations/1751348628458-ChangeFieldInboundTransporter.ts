import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFieldInboundTransporter1751348628458 implements MigrationInterface {
    name = 'ChangeFieldInboundTransporter1751348628458'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "arrival_date"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "departure_date"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "transporter_email"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "arrival_time" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "unloading_start_time" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "unloading_end_time" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "departure_time" TIMESTAMP`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "departure_time"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "unloading_end_time"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "unloading_start_time"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP COLUMN "arrival_time"`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "transporter_email" character varying`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "departure_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD "arrival_date" TIMESTAMP`);
    }

}
