import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInboundTransporter1751335273602 implements MigrationInterface {
    name = 'CreateInboundTransporter1751335273602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inbound_transporter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inbound_plan_id" character varying NOT NULL, "organization_id" integer NOT NULL, "transporter_code_number" character varying, "transporter_name" character varying, "transporter_phone" character varying, "transporter_email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "vehicle_id" uuid, CONSTRAINT "PK_a9400436ffc0ff0a4e134b1a686" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inbound_transporter" ADD CONSTRAINT "FK_b802154279c88854fd091593bb3" FOREIGN KEY ("vehicle_id") REFERENCES "m_vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inbound_transporter" DROP CONSTRAINT "FK_b802154279c88854fd091593bb3"`);
        await queryRunner.query(`DROP TABLE "inbound_transporter"`);
    }

}
