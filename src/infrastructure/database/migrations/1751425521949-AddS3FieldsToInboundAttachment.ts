import { MigrationInterface, QueryRunner } from "typeorm";

export class AddS3FieldsToInboundAttachment1751425521949 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbound_attachment" 
            ADD COLUMN "s3_bucket" VARCHAR,
            ADD COLUMN "s3_key" VARCHAR,
            ADD COLUMN "s3_url" VARCHAR,
            ADD COLUMN "file_size" BIGINT,
            ADD COLUMN "content_type" VARCHAR,
            ADD COLUMN "etag" VARCHAR,
            ADD COLUMN "is_public" BOOLEAN DEFAULT FALSE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbound_attachment" 
            DROP COLUMN "s3_bucket",
            DROP COLUMN "s3_key",
            DROP COLUMN "s3_url",
            DROP COLUMN "file_size",
            DROP COLUMN "content_type",
            DROP COLUMN "etag",
            DROP COLUMN "is_public"
        `);
    }

}
