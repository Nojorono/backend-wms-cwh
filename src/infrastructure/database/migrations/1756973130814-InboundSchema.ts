import { MigrationInterface, QueryRunner } from 'typeorm';

export class InboundSchema1756973130814 implements MigrationInterface {
  name = 'InboundSchema1756973130814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_7fbd789ba2d9f9643ff3be7e7b0"`,
    );
    await queryRunner.query(
      `CREATE TABLE "inbound_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inbound_id" character varying, "inbound_do_id" character varying, "item_id" character varying, "quantity" integer, "classification_id" character varying, "uom" character varying, CONSTRAINT "PK_3f099067f3b718ea896a11f836a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inbound_do" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inbound_id" character varying, "inbound_do_number" character varying, "inbound_number" character varying, "do_date" character varying, "attachment" character varying, "flag_validated" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4e7440905181fdba0f8167015d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inbound" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inbound_number" character varying, "expedition" character varying, "origin" character varying, "license_plate" character varying, "driver_name" character varying, "driver_phone" character varying, "status" character varying, "inbound_type" character varying, "arrival_date" character varying, CONSTRAINT "PK_837651a56a588fd82392d68a5fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_7fbd789ba2d9f9643ff3be7e7b0"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_detail_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "user_detail_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_details" DROP CONSTRAINT "UQ_ef1a1915f99bcf7a87049f74494"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_details" ADD CONSTRAINT "UQ_ef1a1915f99bcf7a87049f74494" UNIQUE ("user_id")`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_detail_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "user_detail_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_7fbd789ba2d9f9643ff3be7e7b0" UNIQUE ("user_detail_id")`,
    );
    await queryRunner.query(`DROP TABLE "inbound"`);
    await queryRunner.query(`DROP TABLE "inbound_do"`);
    await queryRunner.query(`DROP TABLE "inbound_item"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_7fbd789ba2d9f9643ff3be7e7b0" FOREIGN KEY ("user_detail_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
