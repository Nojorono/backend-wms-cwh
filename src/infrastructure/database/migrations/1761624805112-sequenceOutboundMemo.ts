import { MigrationInterface, QueryRunner } from 'typeorm';

export class SequenceOutboundMemo1761624805112 implements MigrationInterface {
  name = 'SequenceOutboundMemo1761624805112';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "outbound_do" ADD "memo_sequence" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "outbound_do" DROP COLUMN "memo_sequence"`);
  }
}
