import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomers1743200000000 implements MigrationInterface {
  name = 'AddCustomers1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "full_name" character varying(255) NOT NULL,
        "phone" character varying(32) NOT NULL,
        "email" character varying(255),
        "date_of_birth" date,
        "gender" character varying(16),
        "notes" text,
        "total_orders" integer NOT NULL DEFAULT 0,
        "total_spend" numeric(12,2) NOT NULL DEFAULT 0,
        "last_visit_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
        CONSTRAINT "customers_tenant_phone_unique" UNIQUE ("tenant_id", "phone")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "customers_tenant_id_index" ON "customers" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "customers_tenant_phone_index" ON "customers" ("tenant_id", "phone")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "staff_id" uuid NOT NULL,
        "note" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_notes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "customer_notes_customer_id_index" ON "customer_notes" ("customer_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "customer_notes"
      ADD CONSTRAINT "fk_customer_notes_customer_id"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "customer_notes"
      ADD CONSTRAINT "fk_customer_notes_staff_id"
      FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "fk_customers_tenant_id"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
    `);

    // orders.customer_id already exists in the schema (nullable uuid)
    // Drop the old FK that incorrectly pointed to users table
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_772d0ce0473ac2ccfa26060dbe9"`);
    // Add correct FK now that customers table exists
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "orders_customer_id_fk"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_fk"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "fk_customers_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "customer_notes" DROP CONSTRAINT IF EXISTS "fk_customer_notes_staff_id"`);
    await queryRunner.query(`ALTER TABLE "customer_notes" DROP CONSTRAINT IF EXISTS "fk_customer_notes_customer_id"`);
    await queryRunner.query(`DROP INDEX "customer_notes_customer_id_index"`);
    await queryRunner.query(`DROP TABLE "customer_notes"`);
    await queryRunner.query(`DROP INDEX "customers_tenant_phone_index"`);
    await queryRunner.query(`DROP INDEX "customers_tenant_id_index"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
