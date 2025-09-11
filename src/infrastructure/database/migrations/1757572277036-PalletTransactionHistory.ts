import { MigrationInterface, QueryRunner } from "typeorm";

export class PalletTransactionHistory1757572277036 implements MigrationInterface {
    name = 'PalletTransactionHistory1757572277036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_operation_type_enum" AS ENUM('ADD', 'REMOVE', 'ADJUST', 'RESET')`);
        await queryRunner.query(`CREATE TABLE "transaction_pallet_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "pallet_id" uuid, "item_id" character varying, "previous_quantity" integer NOT NULL DEFAULT '0', "quantity_change" integer NOT NULL DEFAULT '0', "new_quantity" integer NOT NULL DEFAULT '0', "operation_type" "public"."transaction_pallet_history_operation_type_enum" NOT NULL, "reference_id" character varying, "reference_type" character varying, "notes" character varying, "user_id" character varying, "uom" character varying, CONSTRAINT "PK_4912d9beefa9a553ddb4dec1adb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "m_pallet" ADD "current_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ADD CONSTRAINT "FK_5537724a45a4e373e48e5f37ff5" FOREIGN KEY ("pallet_id") REFERENCES "m_pallet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" DROP CONSTRAINT "FK_5537724a45a4e373e48e5f37ff5"`);
        await queryRunner.query(`ALTER TABLE "m_pallet" DROP COLUMN "current_quantity"`);
        await queryRunner.query(`DROP TABLE "transaction_pallet_history"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_operation_type_enum"`);
    }

}
