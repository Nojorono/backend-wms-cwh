import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaWeekSales1757994058768 implements MigrationInterface {
    name = 'SchemaWeekSales1757994058768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "m_week" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "BULAN" integer, "MINGGU" integer, "QUARTER" integer, "TAHUN" integer, "TANGGAL_AKHIR_MINGGU" TIMESTAMP, "TANGGAL_AKHIR_MINGGU_REAL" TIMESTAMP, "TANGGAL_AWAL_MINGGU" TIMESTAMP, "TANGGAL_AWAL_MINGGU_REAL" TIMESTAMP, CONSTRAINT "PK_eef87bcb9bc2334d79ca8655350" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "m_week"`);
    }

}
