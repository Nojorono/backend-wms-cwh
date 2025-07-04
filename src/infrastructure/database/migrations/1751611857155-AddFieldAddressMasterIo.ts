import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldAddressMasterIo1751611857155 implements MigrationInterface {
    name = 'AddFieldAddressMasterIo1751611857155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_io" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inbound_attachment" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "inbound_attachment" ADD "file_size" integer`);
        await queryRunner.query(`ALTER TABLE "inbound_attachment" ALTER COLUMN "is_public" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_attachment" ALTER COLUMN "is_public" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inbound_attachment" DROP COLUMN "file_size"`);
        await queryRunner.query(`ALTER TABLE "inbound_attachment" ADD "file_size" bigint`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "m_io" DROP COLUMN "address"`);
    }

}
