import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayloadToScheduledTask1781000000001 implements MigrationInterface {
  name = 'AddPayloadToScheduledTask1781000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_tasks" ADD "payload" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scheduled_tasks" DROP COLUMN "payload"`);
  }
}
