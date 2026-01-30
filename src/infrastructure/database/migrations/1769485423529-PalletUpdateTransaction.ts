import { MigrationInterface, QueryRunner } from "typeorm";

export class PalletUpdateTransaction1769485423529 implements MigrationInterface {
    name = 'PalletUpdateTransaction1769485423529'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pallet_update_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "palletUpdateId" uuid NOT NULL, "sequence" integer DEFAULT '1', "palletId" uuid, "itemId" uuid, "quantity" integer DEFAULT '0', "uom" character varying, "productionDate" TIMESTAMP, CONSTRAINT "PK_229c40b9ec4e17423dcbf49b51d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pallet_update_scan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "palletUpdateId" uuid NOT NULL, "scan_number" character varying, "scan_date" TIMESTAMP, "scanByUserId" uuid, "palletId" uuid, "itemId" uuid, "quantity" integer, "uom" character varying, "productionDate" TIMESTAMP, "notes" character varying, "status" character varying, CONSTRAINT "PK_6e8d7a1fb90118d54d970b9ae2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pallet_update_update_type_enum" AS ENUM('UPDATE_PROD_CODE_UOM', 'SPLIT_PALLET', 'MERGE_PALLET')`);
        await queryRunner.query(`CREATE TYPE "public"."pallet_update_status_enum" AS ENUM('PENDING_ASSIGNMENT', 'PENDING_HELPER_ACTION', 'PENDING_INSPECTION', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."pallet_update_inspection_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "pallet_update" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "update_number" character varying, "update_type" "public"."pallet_update_update_type_enum" NOT NULL, "uom" character varying, "production_code" character varying, "status" "public"."pallet_update_status_enum" NOT NULL DEFAULT 'PENDING_ASSIGNMENT', "initiated_by_user_id" uuid NOT NULL, "inspection_status" "public"."pallet_update_inspection_status_enum", "inspection_by_user_id" uuid, "notes" text, "completed_date" TIMESTAMP, CONSTRAINT "UQ_8f3021fc5c8fecb5c7a8e961dc7" UNIQUE ("update_number"), CONSTRAINT "PK_547939ea57121383689230058cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pallet_update_assigned" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "palletUpdateId" uuid NOT NULL, "userId" uuid NOT NULL, "assignedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_9a2a9b307a74428943db93a411d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_operation_type_enum" RENAME TO "transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_operation_type_enum" AS ENUM('ADD', 'PICK', 'REMOVE', 'ADJUST', 'RESET', 'SPLIT', 'MERGE')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "operation_type" TYPE "public"."transaction_pallet_history_operation_type_enum" USING "operation_type"::"text"::"public"."transaction_pallet_history_operation_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" ADD CONSTRAINT "FK_b47ddc17da72ea35005978d446b" FOREIGN KEY ("palletUpdateId") REFERENCES "pallet_update"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" ADD CONSTRAINT "FK_40083e96087c5347f21f9d96746" FOREIGN KEY ("palletId") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" ADD CONSTRAINT "FK_d653fb764c9c3d8984bb06fbcd8" FOREIGN KEY ("itemId") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" ADD CONSTRAINT "FK_3593778e0a012c5d78535ba3688" FOREIGN KEY ("palletUpdateId") REFERENCES "pallet_update"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" ADD CONSTRAINT "FK_f16065818d7bfa6a982ea71ce8a" FOREIGN KEY ("scanByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" ADD CONSTRAINT "FK_6e501879d8306eb04619dea1132" FOREIGN KEY ("palletId") REFERENCES "m_pallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" ADD CONSTRAINT "FK_1fdf5b59e4ed001bf7556586c2c" FOREIGN KEY ("itemId") REFERENCES "m_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update" ADD CONSTRAINT "FK_3b28327dd0d3891263f9a626c33" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update" ADD CONSTRAINT "FK_78239bd5ff1206888e77defacc0" FOREIGN KEY ("inspection_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_assigned" ADD CONSTRAINT "FK_6ddf423bcf1db402cb9ac799c5b" FOREIGN KEY ("palletUpdateId") REFERENCES "pallet_update"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pallet_update_assigned" ADD CONSTRAINT "FK_fa0dc09290c6341f215282892b2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pallet_update_assigned" DROP CONSTRAINT "FK_fa0dc09290c6341f215282892b2"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_assigned" DROP CONSTRAINT "FK_6ddf423bcf1db402cb9ac799c5b"`);
        await queryRunner.query(`ALTER TABLE "pallet_update" DROP CONSTRAINT "FK_78239bd5ff1206888e77defacc0"`);
        await queryRunner.query(`ALTER TABLE "pallet_update" DROP CONSTRAINT "FK_3b28327dd0d3891263f9a626c33"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" DROP CONSTRAINT "FK_1fdf5b59e4ed001bf7556586c2c"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" DROP CONSTRAINT "FK_6e501879d8306eb04619dea1132"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" DROP CONSTRAINT "FK_f16065818d7bfa6a982ea71ce8a"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_scan" DROP CONSTRAINT "FK_3593778e0a012c5d78535ba3688"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" DROP CONSTRAINT "FK_d653fb764c9c3d8984bb06fbcd8"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" DROP CONSTRAINT "FK_40083e96087c5347f21f9d96746"`);
        await queryRunner.query(`ALTER TABLE "pallet_update_item" DROP CONSTRAINT "FK_b47ddc17da72ea35005978d446b"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_pallet_history_operation_type_enum_old" AS ENUM('ADD', 'PICK', 'REMOVE', 'ADJUST', 'RESET')`);
        await queryRunner.query(`ALTER TABLE "transaction_pallet_history" ALTER COLUMN "operation_type" TYPE "public"."transaction_pallet_history_operation_type_enum_old" USING "operation_type"::"text"::"public"."transaction_pallet_history_operation_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_pallet_history_operation_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transaction_pallet_history_operation_type_enum_old" RENAME TO "transaction_pallet_history_operation_type_enum"`);
        await queryRunner.query(`DROP TABLE "pallet_update_assigned"`);
        await queryRunner.query(`DROP TABLE "pallet_update"`);
        await queryRunner.query(`DROP TYPE "public"."pallet_update_inspection_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pallet_update_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pallet_update_update_type_enum"`);
        await queryRunner.query(`DROP TABLE "pallet_update_scan"`);
        await queryRunner.query(`DROP TABLE "pallet_update_item"`);
    }

}
