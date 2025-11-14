import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMoveLocation1763112284642 implements MigrationInterface {
    name = 'CreateMoveLocation1763112284642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_movement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "source_warehouse_id" uuid, "source_warehouse_sub_id" uuid, "source_bin_id" uuid, "destination_warehouse_id" uuid, "destination_warehouse_sub_id" uuid, "destination_bin_id" uuid, "status" character varying DEFAULT 'PENDING', "assigned_user_id" character varying, "assigned_user_name" character varying, "movement_date" TIMESTAMP, "completed_date" TIMESTAMP, "notes" character varying, "moved_by" character varying, CONSTRAINT "PK_e17362693c889da517444ad8fb5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_movement_pallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "inventory_movement_id" uuid, "pallet_id" uuid, "inventory_tracking_id" uuid, "is_completed" boolean DEFAULT false, "completed_at" TIMESTAMP, CONSTRAINT "PK_59a020c180cbaed34ef20bf922e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_aa894696224c7f34f1f84a2de02" FOREIGN KEY ("source_warehouse_id") REFERENCES "m_warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_8965602bc95b183d168b0070006" FOREIGN KEY ("source_warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_6e83b00c05a1b7b513b152f78fd" FOREIGN KEY ("source_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_7a46f002058b5b90bfb99b0d05a" FOREIGN KEY ("destination_warehouse_id") REFERENCES "m_warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_f1c6dd4d1c5605acf20dbf4734c" FOREIGN KEY ("destination_warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_0a8321b7ed70f10695830856d7a" FOREIGN KEY ("destination_bin_id") REFERENCES "m_warehouse_bin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" ADD CONSTRAINT "FK_4f71c645763697f7bd7764656bb" FOREIGN KEY ("inventory_movement_id") REFERENCES "inventory_movement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" ADD CONSTRAINT "FK_0202dc76bf29b76bb2bbc4d94c2" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" ADD CONSTRAINT "FK_9c564107ce0e1cfbe723442fe7b" FOREIGN KEY ("inventory_tracking_id") REFERENCES "inventory_tracking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" DROP CONSTRAINT "FK_9c564107ce0e1cfbe723442fe7b"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" DROP CONSTRAINT "FK_0202dc76bf29b76bb2bbc4d94c2"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement_pallet" DROP CONSTRAINT "FK_4f71c645763697f7bd7764656bb"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_0a8321b7ed70f10695830856d7a"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_f1c6dd4d1c5605acf20dbf4734c"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_7a46f002058b5b90bfb99b0d05a"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_6e83b00c05a1b7b513b152f78fd"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_8965602bc95b183d168b0070006"`);
        await queryRunner.query(`ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_aa894696224c7f34f1f84a2de02"`);
        await queryRunner.query(`DROP TABLE "inventory_movement_pallet"`);
        await queryRunner.query(`DROP TABLE "inventory_movement"`);
    }

}
