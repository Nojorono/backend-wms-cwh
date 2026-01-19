import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTrackingHistory1759216766685 implements MigrationInterface {
  name = 'CreateInventoryTrackingHistory1759216766685';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction_put_away" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inventory_tracking_id" uuid, "destination_bin_id" uuid, "forklift_driver_id" uuid, "driver_name" character varying, "driver_phone" character varying, "status" character varying, "notes" character varying, CONSTRAINT "PK_1332e12786cd70ebfe6df098472" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_tracking_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inventory_tracking_id" uuid, "pallet_id" uuid, "warehouse_id" uuid, "warehouse_sub_id" uuid, "warehouse_bin_id" uuid, "inventory_date" TIMESTAMP, "inventory_status" character varying, "inventory_note" character varying, "action" character varying(32) NOT NULL DEFAULT 'CREATED', CONSTRAINT "PK_547db6cf209cfa506fbc083f233" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" ADD CONSTRAINT "FK_a49ac7721871b2556c044e73013" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" ADD CONSTRAINT "FK_8e8d1ed7c3915337450d087cae6" FOREIGN KEY ("destination_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" ADD CONSTRAINT "FK_f8c2ea053e42155f87004cd6d55" FOREIGN KEY ("forklift_driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" ADD CONSTRAINT "FK_bc983c02d90d8b89061d947c87a" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" ADD CONSTRAINT "FK_24acccfde96eb2034283bb740ff" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" ADD CONSTRAINT "FK_b26520fce4dd41e236c0b64f163" FOREIGN KEY ("warehouse_id") REFERENCES "m_warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" ADD CONSTRAINT "FK_d832d548e4a625f0d8f58ce9113" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" ADD CONSTRAINT "FK_928e874faca5311d17d7b8d88de" FOREIGN KEY ("warehouse_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" DROP CONSTRAINT "FK_928e874faca5311d17d7b8d88de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" DROP CONSTRAINT "FK_d832d548e4a625f0d8f58ce9113"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" DROP CONSTRAINT "FK_b26520fce4dd41e236c0b64f163"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" DROP CONSTRAINT "FK_24acccfde96eb2034283bb740ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_tracking_history" DROP CONSTRAINT "FK_bc983c02d90d8b89061d947c87a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" DROP CONSTRAINT "FK_f8c2ea053e42155f87004cd6d55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" DROP CONSTRAINT "FK_8e8d1ed7c3915337450d087cae6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_put_away" DROP CONSTRAINT "FK_a49ac7721871b2556c044e73013"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_tracking_history"`);
    await queryRunner.query(`DROP TABLE "transaction_put_away"`);
  }
}
