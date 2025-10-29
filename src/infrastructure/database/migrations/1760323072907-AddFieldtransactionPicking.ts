import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldtransactionPicking1760323072907 implements MigrationInterface {
  name = 'AddFieldtransactionPicking1760323072907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_a916d1891768ea69a586df955ff"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "pallet_id"`);
    await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "pallet_source_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transaction_picking" ADD "flag_whole_pallet" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_de4b92e7d96c43cf8c97fab93a3" FOREIGN KEY ("pallet_source_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction_picking" DROP CONSTRAINT "FK_de4b92e7d96c43cf8c97fab93a3"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "flag_whole_pallet"`);
    await queryRunner.query(`ALTER TABLE "transaction_picking" DROP COLUMN "pallet_source_id"`);
    await queryRunner.query(`ALTER TABLE "transaction_picking" ADD "pallet_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transaction_picking" ADD CONSTRAINT "FK_a916d1891768ea69a586df955ff" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
