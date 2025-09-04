import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFieldUser1756351648968 implements MigrationInterface {
  name = 'FixFieldUser1756351648968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "organization_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "organization_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_name" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "first_name" character varying(100) NOT NULL`,
    );
  }
}
