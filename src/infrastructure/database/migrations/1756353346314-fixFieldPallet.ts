import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFieldPallet1756353346314 implements MigrationInterface {
  name = 'FixFieldPallet1756353346314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "m_pallet" ADD "uom" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "uom"`);
  }
}
