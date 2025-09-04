import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserDetail1756872128240 implements MigrationInterface {
  name = 'CreateUserDetail1756872128240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying(100) NOT NULL, "employee_id" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(255) NOT NULL, "organization_id" uuid NOT NULL, CONSTRAINT "UQ_ef1a1915f99bcf7a87049f74494" UNIQUE ("user_id"), CONSTRAINT "PK_fb08394d3f499b9e441cab9ca51" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ef1a1915f99bcf7a87049f7449" ON "user_details" ("user_id") `,
    );

    await queryRunner.query(`ALTER TABLE "users" ADD "user_detail_id" uuid`);

    await queryRunner.query(
      `INSERT INTO "m_io" ("id", "organization_id", "organization_name", "operating_unit", "created_at", "updated_at") VALUES (uuid_generate_v4(), 1, 'Default Organization', 'Default Unit', now(), now())`,
    );

    const defaultOrg = await queryRunner.query(
      `SELECT id FROM "m_io" WHERE organization_id = 1 LIMIT 1`,
    );
    const defaultOrgId = defaultOrg[0]?.id;

    if (defaultOrgId) {
      const existingUsers = await queryRunner.query(
        `SELECT id, username FROM "users"`,
      );

      for (const user of existingUsers) {
        const userDetailId = await queryRunner.query(
          `INSERT INTO "user_details" ("id", "user_id", "employee_id", "email", "phone", "organization_id", "created_at", "updated_at") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, now(), now()) RETURNING id`,
          [
            user.username,
            `EMP_${user.username}`,
            `${user.username}@default.com`,
            '0000000000',
            defaultOrgId,
          ],
        );

        if (userDetailId[0]?.id) {
          await queryRunner.query(
            `UPDATE "users" SET "user_detail_id" = $1 WHERE "id" = $2`,
            [userDetailId[0].id, user.id],
          );
        }
      }
    }

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "user_detail_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_7fbd789ba2d9f9643ff3be7e7b0" UNIQUE ("user_detail_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_details" ADD CONSTRAINT "FK_8ee6c4e464e4375b3b323963745" FOREIGN KEY ("organization_id") REFERENCES "m_io"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_7fbd789ba2d9f9643ff3be7e7b0" FOREIGN KEY ("user_detail_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_7fbd789ba2d9f9643ff3be7e7b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_details" DROP CONSTRAINT "FK_8ee6c4e464e4375b3b323963745"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_7fbd789ba2d9f9643ff3be7e7b0"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_detail_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef1a1915f99bcf7a87049f7449"`,
    );
    await queryRunner.query(`DROP TABLE "user_details"`);
    await queryRunner.query(`DELETE FROM "m_io" WHERE organization_id = 1`);
  }
}
