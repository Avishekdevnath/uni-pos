import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventory1773587654303 implements MigrationInterface {
    name = 'AddInventory1773587654303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventory_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "type" character varying(32) NOT NULL, "description" text, "status" character varying(32) NOT NULL DEFAULT 'completed', "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1b670b7f687d8b8c58ef8d4629a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "inventory_batches_tenant_branch_index" ON "inventory_batches" ("tenant_id", "branch_id") `);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, "movement_type" character varying(32) NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit_cost" numeric(12,2), "order_id" uuid, "batch_id" uuid, "client_event_id" uuid, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "inventory_movements_tenant_branch_product_created_index" ON "inventory_movements" ("tenant_id", "branch_id", "product_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "inventory_balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, "on_hand_qty" numeric(12,3) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "inventory_balances_tenant_branch_product_unique" UNIQUE ("tenant_id", "branch_id", "product_id"), CONSTRAINT "PK_4abb5082c6c3dcf55f1b124d2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "branch_product_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, "low_stock_threshold" numeric(12,3), "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "branch_product_configs_tenant_branch_product_unique" UNIQUE ("tenant_id", "branch_id", "product_id"), CONSTRAINT "PK_7033979f79062e787d04e6b67b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" ADD CONSTRAINT "FK_fe7ad0d447c244d7063e66f5961" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" ADD CONSTRAINT "FK_81965eaff8df70eead18614595d" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" ADD CONSTRAINT "FK_100323267836a7f6dca2d11845a" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_08344cc99d67ce2b3bd27831e13" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1ab8073a9fb9462a50ac175cb21" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_5c3bec1682252c36fa161587738" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_0d8d237c78afa95bb19afcb5172" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" ADD CONSTRAINT "FK_af8b36f15ba614dbe4432c12200" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" ADD CONSTRAINT "FK_cd1b2668b4259a82c19c80d3232" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" ADD CONSTRAINT "FK_328cfceff155d8d993ca74ab3e5" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_product_configs" ADD CONSTRAINT "FK_3c808828e6011b6e254ecdbed5a" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_product_configs" ADD CONSTRAINT "FK_1c8d12e74d7e3f12a7179e033ba" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_product_configs" ADD CONSTRAINT "FK_83ef2001ce78e0c171868cfbcf0" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE inventory_balances ADD CONSTRAINT chk_inventory_balances_on_hand_qty_non_negative CHECK (on_hand_qty >= 0)`);
        await queryRunner.query(`CREATE UNIQUE INDEX idx_inventory_movements_client_event_id ON inventory_movements (client_event_id) WHERE client_event_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_order_id ON inventory_movements (order_id) WHERE order_id IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX idx_inventory_movements_batch_id ON inventory_movements (batch_id) WHERE batch_id IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "branch_product_configs" DROP CONSTRAINT "FK_83ef2001ce78e0c171868cfbcf0"`);
        await queryRunner.query(`ALTER TABLE "branch_product_configs" DROP CONSTRAINT "FK_1c8d12e74d7e3f12a7179e033ba"`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_client_event_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_order_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_movements_batch_id`);
        await queryRunner.query(`ALTER TABLE inventory_balances DROP CONSTRAINT IF EXISTS chk_inventory_balances_on_hand_qty_non_negative`);
        await queryRunner.query(`ALTER TABLE "branch_product_configs" DROP CONSTRAINT "FK_3c808828e6011b6e254ecdbed5a"`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" DROP CONSTRAINT "FK_328cfceff155d8d993ca74ab3e5"`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" DROP CONSTRAINT "FK_cd1b2668b4259a82c19c80d3232"`);
        await queryRunner.query(`ALTER TABLE "inventory_balances" DROP CONSTRAINT "FK_af8b36f15ba614dbe4432c12200"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_0d8d237c78afa95bb19afcb5172"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_5c3bec1682252c36fa161587738"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1ab8073a9fb9462a50ac175cb21"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_08344cc99d67ce2b3bd27831e13"`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" DROP CONSTRAINT "FK_100323267836a7f6dca2d11845a"`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" DROP CONSTRAINT "FK_81965eaff8df70eead18614595d"`);
        await queryRunner.query(`ALTER TABLE "inventory_batches" DROP CONSTRAINT "FK_fe7ad0d447c244d7063e66f5961"`);
        await queryRunner.query(`DROP TABLE "branch_product_configs"`);
        await queryRunner.query(`DROP TABLE "inventory_balances"`);
        await queryRunner.query(`DROP INDEX "public"."inventory_movements_tenant_branch_product_created_index"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP INDEX "public"."inventory_batches_tenant_branch_index"`);
        await queryRunner.query(`DROP TABLE "inventory_batches"`);
    }

}
