import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWarehouseHub1761023589318 implements MigrationInterface {
    name = 'FixWarehouseHub1761023589318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_operation_type_enum" RENAME TO "transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_operation_type_enum" AS ENUM('ADD', 'PICK', 'REMOVE', 'ADJUST', 'RESET')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "operation_type" TYPE "public"."transaction_pallet_history_operation_type_enum" USING "operation_type"::"text"::"public"."transaction_pallet_history_operation_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "warehouse_sub_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "warehouse_sub_id" uuid`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD CONSTRAINT "FK_be63c5823aa54b1aafdae5e130b" FOREIGN KEY ("warehouse_sub_id") REFERENCES "m_warehouse_sub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP CONSTRAINT "FK_be63c5823aa54b1aafdae5e130b"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" DROP COLUMN "warehouse_sub_id"`);
        await queryRunner.query(`ALTER TABLE "m_warehouse_bin" ADD "warehouse_sub_id" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_operation_type_enum_old" AS ENUM('ADD', 'REMOVE', 'ADJUST', 'RESET')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "operation_type" TYPE "public"."transaction_pallet_history_operation_type_enum_old" USING "operation_type"::"text"::"public"."transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_operation_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_operation_type_enum_old" RENAME TO "transaction_pallet_history_operation_type_enum"`);
    }

}
