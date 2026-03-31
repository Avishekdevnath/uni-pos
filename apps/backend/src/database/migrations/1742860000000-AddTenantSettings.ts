import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantSettings1742860000000 implements MigrationInterface {
  name = 'AddTenantSettings1742860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_settings" (
        "id"                        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"                 uuid NOT NULL,
        "store_name"                character varying(255),
        "store_email"               character varying(255),
        "store_phone"               character varying(64),
        "store_address"             text,
        "timezone"                  character varying(64)  NOT NULL DEFAULT 'Asia/Dhaka',
        "default_currency"          character varying(8)   NOT NULL DEFAULT 'BDT',
        "currency_symbol_position"  character varying(8)   NOT NULL DEFAULT 'before',
        "currency_decimal_places"   integer                NOT NULL DEFAULT 2,
        "thousands_separator"       character varying(4)   NOT NULL DEFAULT ',',
        "decimal_separator"         character varying(4)   NOT NULL DEFAULT '.',
        "supported_currencies"      text                   NOT NULL DEFAULT 'BDT',
        "receipt_header"            text,
        "receipt_footer"            text                   NOT NULL DEFAULT 'Thank you for your purchase!',
        "receipt_show_logo"         boolean                NOT NULL DEFAULT false,
        "order_number_prefix"       character varying(16)  NOT NULL DEFAULT 'ORD',
        "payment_methods"           text                   NOT NULL DEFAULT '["cash"]',
        "low_stock_threshold"       integer                NOT NULL DEFAULT 5,
        "track_inventory"           boolean                NOT NULL DEFAULT true,
        "created_at"                TIMESTAMP              NOT NULL DEFAULT now(),
        "updated_at"                TIMESTAMP              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "tenant_settings_tenant_id_unique"
      ON "tenant_settings" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_settings"`);
  }
}
