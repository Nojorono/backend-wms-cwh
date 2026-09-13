import { MigrationInterface, QueryRunner } from "typeorm";

export class FieldPrincipal1773711880691 implements MigrationInterface {
    name = 'FieldPrincipal1773711880691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_do" ADD "principal" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "principal"`);
    }

}
