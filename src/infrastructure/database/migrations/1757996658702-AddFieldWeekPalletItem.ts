import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldWeekPalletItem1757996658702 implements MigrationInterface {
  name = 'AddFieldWeekPalletItem1757996658702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ADD "week_number" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_pallet_history" DROP COLUMN "week_number"`);
  }
}
