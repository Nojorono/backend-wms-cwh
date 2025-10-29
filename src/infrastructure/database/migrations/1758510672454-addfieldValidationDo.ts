import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddfieldValidationDo1758510672454 implements MigrationInterface {
  name = 'AddfieldValidationDo1758510672454';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inbound_do" ADD "validation_surat_jalan" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inbound_do" DROP COLUMN "validation_surat_jalan"`);
  }
}
