import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldtransactionPicking1760322501695 implements MigrationInterface {
  name = 'AddFieldtransactionPicking1760322501695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "uom" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "uom"`);
  }
}
