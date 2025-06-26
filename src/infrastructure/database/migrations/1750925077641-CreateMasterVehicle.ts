import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMasterVehicle1750925077641 implements MigrationInterface {
    name = 'CreateMasterVehicle1750925077641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "m_vehicle" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_type" character varying NOT NULL, "vehicle_brand" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_acc5525e6e9442189fc46116605" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "m_vehicle"`);
    }

}
