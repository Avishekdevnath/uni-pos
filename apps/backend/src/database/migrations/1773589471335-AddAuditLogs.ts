import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogs1773589471335 implements MigrationInterface {
    name = 'AddAuditLogs1773589471335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_order_item_taxes_order_item_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_client_event_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_order_number"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_customer_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_client_event_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payments_branch_received"`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid, "actor_id" uuid, "event_type" character varying(100) NOT NULL, "entity_type" character varying(100) NOT NULL, "entity_id" uuid NOT NULL, "payload" jsonb NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "audit_logs_entity_index" ON "audit_logs" ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "audit_logs_tenant_event_time_index" ON "audit_logs" ("tenant_id", "event_type", "occurred_at") `);
        await queryRunner.query(`CREATE INDEX idx_audit_logs_payload ON audit_logs USING GIN (payload)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_payload`);
        await queryRunner.query(`DROP INDEX "public"."audit_logs_tenant_event_time_index"`);
        await queryRunner.query(`DROP INDEX "public"."audit_logs_entity_index"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`CREATE INDEX "idx_payments_branch_received" ON "payments" ("branch_id", "received_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payments_client_event_id" ON "payments" ("client_event_id") WHERE (client_event_id IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_payments_order_id" ON "payments" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_customer_id" ON "orders" ("customer_id") WHERE (customer_id IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_orders_order_number" ON "orders" ("order_number") WHERE (order_number IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_orders_client_event_id" ON "orders" ("client_event_id") WHERE (client_event_id IS NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product_id" ON "order_items" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "idx_order_item_taxes_order_item_id" ON "order_item_taxes" ("order_item_id") `);
    }

}
