import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInboundFieldReference1769137072358 implements MigrationInterface {
    name = 'AddInboundFieldReference1769137072358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" ADD "inbound_id_reference" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound" DROP COLUMN "inbound_id_reference"`);
    }

}
