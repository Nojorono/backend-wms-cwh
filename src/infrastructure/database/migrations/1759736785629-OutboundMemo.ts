import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundMemo1759736785629 implements MigrationInterface {
  name = 'OutboundMemo1759736785629';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "outbound_memo_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "outbound_memo_id" uuid, "item_id" uuid, "quantity_plan" integer, "uom" character varying, CONSTRAINT "PK_f88af7c767cff095627f928763c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbound_memo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "requestor" character varying, "origin" character varying, "ship_to" character varying, "destination" character varying, "delivery_date" TIMESTAMP, "status" character varying, "notes" character varying, CONSTRAINT "PK_6259dc4e4f07a494ca592a7a255" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_do" ALTER COLUMN "integration_status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbound_memo_item" ADD CONSTRAINT "FK_92991f6b2a3653eac1040375f8f" FOREIGN KEY ("outbound_memo_id") REFERENCES "outbound_memo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbound_memo_item" ADD CONSTRAINT "FK_a8508fffaf8393fd61a3ae4d47b" FOREIGN KEY ("item_id") REFERENCES "m_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbound_memo_item" DROP CONSTRAINT "FK_a8508fffaf8393fd61a3ae4d47b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbound_memo_item" DROP CONSTRAINT "FK_92991f6b2a3653eac1040375f8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inbound_do" ALTER COLUMN "integration_status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TABLE "outbound_memo"`);
    await queryRunner.query(`DROP TABLE "outbound_memo_item"`);
  }
}
