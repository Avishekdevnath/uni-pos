import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrdersAndPayments1773588729816 implements MigrationInterface {
    name = 'AddOrdersAndPayments1773588729816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_client_event_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_inventory_movements_batch_id"`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" DROP CONSTRAINT "chk_inventory_balances_on_hand_qty_non_negative"`);
        await queryRunner.query(`CREATE TABLE "order_item_taxes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_item_id" uuid NOT NULL, "tax_config_id" uuid NOT NULL, "tax_name_snapshot" character varying(100) NOT NULL, "tax_rate_snapshot" numeric(5,2) NOT NULL, "is_inclusive" boolean NOT NULL, "tax_amount" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3eb1f304c128a159923664b703a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "line_subtotal" numeric(12,2) NOT NULL DEFAULT '0', "line_discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "order_discount_share" numeric(12,2) NOT NULL DEFAULT '0', "discounted_amount" numeric(12,2) NOT NULL DEFAULT '0', "base_amount" numeric(12,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "line_total" numeric(12,2) NOT NULL DEFAULT '0', "product_name_snapshot" character varying(255), "sku_snapshot" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_discounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "discount_preset_id" uuid NOT NULL, "computed_amount" numeric(12,2) NOT NULL DEFAULT '0', "preset_name_snapshot" character varying(100) NOT NULL, "type_snapshot" character varying(16) NOT NULL, "value_snapshot" numeric(12,2) NOT NULL, "scope_snapshot" character varying(16) NOT NULL, "order_item_id_snapshot" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4a40a77b36d106ef37580a6341" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "customer_id" uuid, "order_number" character varying(64), "status" character varying(32) NOT NULL DEFAULT 'draft', "subtotal_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "paid_amount" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "client_event_id" uuid, "cancelled_at" TIMESTAMP, "cancelled_by" uuid, "cancellation_reason" text, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "orders_tenant_branch_status_created_index" ON "orders" ("tenant_id", "branch_id", "status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "order_number_sequences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "branch_id" uuid NOT NULL, "sequence_date" character varying(10) NOT NULL, "last_sequence" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4fddcb23b0a9fad8917b690cb42" UNIQUE ("branch_id", "sequence_date"), CONSTRAINT "PK_5906682f86316bfbadf8259001c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "method" character varying(32) NOT NULL DEFAULT 'cash', "amount" numeric(12,2) NOT NULL, "cash_tendered" numeric(12,2), "status" character varying(32) NOT NULL DEFAULT 'completed', "client_event_id" uuid, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_item_taxes" ADD CONSTRAINT "FK_fee1162007eb193add008cf883b" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item_taxes" ADD CONSTRAINT "FK_fba22a11afdd27ebb2d78107135" FOREIGN KEY ("tax_config_id") REFERENCES "tax_configs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_discounts" ADD CONSTRAINT "FK_e7b488cebe333f449398769b2cc" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_discounts" ADD CONSTRAINT "FK_bf56ec30823711c98184b593295" FOREIGN KEY ("discount_preset_id") REFERENCES "discount_presets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_17b723da2c12837f4bc21e33398" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_94f4f29857aa6b3586e1528be04" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_number_sequences" ADD CONSTRAINT "FK_b7d07f2733ce31f8427cd9bc16f" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9109b53fca5cef7720aca72974d" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b50ef2c264e6c0fda8c639935af" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        // Partial unique index: one client_event_id per tenant (orders)
        await queryRunner.query(`CREATE UNIQUE INDEX idx_orders_client_event_id ON orders (client_event_id) WHERE client_event_id IS NOT NULL`);
        // Partial unique index for payments
        await queryRunner.query(`CREATE UNIQUE INDEX idx_payments_client_event_id ON payments (client_event_id) WHERE client_event_id IS NOT NULL`);
        // Partial unique index for order_number
        await queryRunner.query(`CREATE UNIQUE INDEX idx_orders_order_number ON orders (order_number) WHERE order_number IS NOT NULL`);
        // Partial index on customer_id
        await queryRunner.query(`CREATE INDEX idx_orders_customer_id ON orders (customer_id) WHERE customer_id IS NOT NULL`);
        // Composite for payments reporting
        await queryRunner.query(`CREATE INDEX idx_payments_branch_received ON payments (branch_id, received_at)`);
        // FK lookup indexes not auto-created
        await queryRunner.query(`CREATE INDEX idx_order_items_product_id ON order_items (product_id)`);
        await queryRunner.query(`CREATE INDEX idx_order_item_taxes_order_item_id ON order_item_taxes (order_item_id)`);
        await queryRunner.query(`CREATE INDEX idx_payments_order_id ON payments (order_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b50ef2c264e6c0fda8c639935af"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9109b53fca5cef7720aca72974d"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "order_number_sequences" DROP CONSTRAINT "FK_b7d07f2733ce31f8427cd9bc16f"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_94f4f29857aa6b3586e1528be04"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_17b723da2c12837f4bc21e33398"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_527dd6efd5f3402f729c6b3e826"`);
        await queryRunner.query(`ALTER TABLE "order_discounts" DROP CONSTRAINT "FK_bf56ec30823711c98184b593295"`);
        await queryRunner.query(`ALTER TABLE "order_discounts" DROP CONSTRAINT "FK_e7b488cebe333f449398769b2cc"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "order_item_taxes" DROP CONSTRAINT "FK_fba22a11afdd27ebb2d78107135"`);
        await queryRunner.query(`ALTER TABLE "order_item_taxes" DROP CONSTRAINT "FK_fee1162007eb193add008cf883b"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "order_number_sequences"`);
        await queryRunner.query(`DROP INDEX "public"."orders_tenant_branch_status_created_index"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "order_discounts"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "order_item_taxes"`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_client_event_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_client_event_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_order_number`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_customer_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_branch_received`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_order_item_taxes_order_item_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_payments_order_id`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_inventory_balances_on_hand_qty_non_negative" CHECK ((on_hand_qty >= (0)::numeric))`);
        await queryRunner.query(`CREATE INDEX "idx_inventory_movements_batch_id" ON "inventory_movements" ("batch_id") WHERE (batch_id IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_inventory_movements_order_id" ON "inventory_movements" ("order_id") WHERE (order_id IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_inventory_movements_client_event_id" ON "inventory_movements" ("client_event_id") WHERE (client_event_id IS NOT NULL)`);
    }

}
