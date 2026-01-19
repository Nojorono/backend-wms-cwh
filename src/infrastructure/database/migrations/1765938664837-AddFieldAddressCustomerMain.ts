import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldAddressCustomerMain1765938664837 implements MigrationInterface {
    name = 'AddFieldAddressCustomerMain1765938664837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_main" ADD "address" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_main" DROP COLUMN "address"`);
    }

}
