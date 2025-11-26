import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSchemaPutaway1764143554573 implements MigrationInterface {
    name = 'FixSchemaPutaway1764143554573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "uom" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "quantity" integer`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "week_number" integer`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "production_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD "inbound_id" uuid`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" ADD CONSTRAINT "FK_c9a701fa55467eb9374dfa927b8" FOREIGN KEY ("inbound_id") REFERENCES "inbound"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP CONSTRAINT "FK_c9a701fa55467eb9374dfa927b8"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "inbound_id"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "production_date"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "week_number"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "transaction_put_away" DROP COLUMN "uom"`);
    }

}
