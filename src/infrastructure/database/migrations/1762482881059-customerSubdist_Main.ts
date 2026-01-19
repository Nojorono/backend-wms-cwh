import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomerSubdistMain1762482881059 implements MigrationInterface {
    name = 'CustomerSubdistMain1762482881059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer_main" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "business_group_id" integer, "date_from" date, "date_to" date, "default_legal_context_id" character varying(100), "location_code" character varying(50), "location_description" character varying(255), "name" character varying(255), "org_code" character varying(50), "org_id" integer, "set_of_books_id" character varying(100), "short_code" character varying(20), "usable_flag" boolean DEFAULT true, CONSTRAINT "PK_c0f249e21d044cebe4965f91806" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_subdist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "cust_account_id" integer, "customer_name" character varying(255), "customer_number" character varying(50), "address1" text, "provinsi" character varying(100), "kab_kodya" character varying(100), "kecamatan" character varying(100), "kelurahan" character varying(100), "org_id" integer, "channel" character varying(10), "status" character varying(20), "site_type" character varying(50), "bill_to_location" character varying(255), "bill_to_site_use_id" integer, "ship_to_location" character varying(255), "ship_to_site_use_id" integer, "credit_checking" character varying(1), "overall_credit_limit" bigint, "trx_credit_limit" bigint, "term_id" integer, "term_name" character varying(100), "term_day" integer, "price_list_id" integer, "price_list_name" character varying(255), "order_type_id" integer, "order_type_name" character varying(100), "return_order_type_id" integer, "return_order_type_name" character varying(100), "last_update_date" TIMESTAMP, CONSTRAINT "PK_3077e0cdd149bb82809208de8b2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "customer_subdist"`);
        await queryRunner.query(`DROP TABLE "customer_main"`);
    }

}
