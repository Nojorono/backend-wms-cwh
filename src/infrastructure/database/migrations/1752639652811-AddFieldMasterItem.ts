import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldMasterItem1752639652811 implements MigrationInterface {
  name = 'AddFieldMasterItem1752639652811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "m_item" ADD "item_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "m_item" ADD "inventory_item_id" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "m_item" ADD "dus_per_stack" integer`);
    await queryRunner.query(`ALTER TABLE "m_item" ADD "bal_per_dus" integer`);
    await queryRunner.query(`ALTER TABLE "m_item" ADD "press_per_bal" integer`);
    await queryRunner.query(`ALTER TABLE "m_item" ADD "bks_per_press" integer`);
    await queryRunner.query(`ALTER TABLE "m_item" ADD "btg_per_bks" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "btg_per_bks"`);
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "bks_per_press"`);
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "press_per_bal"`);
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "bal_per_dus"`);
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "dus_per_stack"`);
    await queryRunner.query(
      `ALTER TABLE "m_item" DROP COLUMN "inventory_item_id"`,
    );
    await queryRunner.query(`ALTER TABLE "m_item" DROP COLUMN "item_number"`);
    await queryRunner.query(
      `ALTER TABLE "m_item" ADD "name" character varying`,
    );
  }
}
