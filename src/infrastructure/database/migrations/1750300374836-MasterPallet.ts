import { MigrationInterface, QueryRunner } from "typeorm";

export class MasterPallet1750300374836 implements MigrationInterface {
    name = 'MasterPallet1750300374836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing table if it exists
        await queryRunner.query(`DROP TABLE IF EXISTS "m_pallet" CASCADE`);
        
        // Create the table with the proper structure
        await queryRunner.query(`
            CREATE TABLE "m_pallet" (
                "id" SERIAL NOT NULL,
                "client_id" character varying,
                "code" character varying NOT NULL,
                "uom_name" character varying NOT NULL,
                "capacity" integer,
                "is_active" boolean NOT NULL DEFAULT true,
                "is_empty" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_m_pallet" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_m_pallet_code" UNIQUE ("code")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the table
        await queryRunner.query(`DROP TABLE "m_pallet"`);
    }

}
