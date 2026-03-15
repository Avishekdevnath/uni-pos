import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaxAndDiscounts1773586999152 implements MigrationInterface {
    name = 'AddTaxAndDiscounts1773586999152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tax_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "tax_groups_tenant_name_unique" UNIQUE ("tenant_id", "name"), CONSTRAINT "PK_eae1ea5fef32cb6f21f4ab68d04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tax_groups_tenant_id_index" ON "tax_groups" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "tax_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "tax_group_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "rate" numeric(5,2) NOT NULL, "is_inclusive" boolean NOT NULL DEFAULT false, "sort_order" integer NOT NULL DEFAULT '0', "status" character varying(32) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fefada95a3b9edeac02a5c7b5dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tax_configs_tenant_branch_group_index" ON "tax_configs" ("tenant_id", "branch_id", "tax_group_id") `);
        await queryRunner.query(`CREATE INDEX "tax_configs_tenant_branch_index" ON "tax_configs" ("tenant_id", "branch_id") `);
        await queryRunner.query(`CREATE TABLE "discount_presets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "type" character varying(16) NOT NULL, "value" numeric(12,2) NOT NULL, "scope" character varying(16) NOT NULL, "max_discount_amount" numeric(12,2), "min_order_amount" numeric(12,2), "valid_from" TIMESTAMP WITH TIME ZONE, "valid_until" TIMESTAMP WITH TIME ZONE, "is_combinable" boolean NOT NULL DEFAULT true, "status" character varying(32) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f211be816951bfed842b5d5aeb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "discount_presets_tenant_id_index" ON "discount_presets" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "discount_preset_branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "discount_preset_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "discount_preset_branches_preset_branch_unique" UNIQUE ("discount_preset_id", "branch_id"), CONSTRAINT "PK_9ad41dee52611fd87bc566c61f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "tax_group_id" uuid`);
        await queryRunner.query(`ALTER TABLE "tax_groups" ADD CONSTRAINT "FK_306659a1d6a86123d609f999847" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_fa5577d2a5137745afb4f4266bd" FOREIGN KEY ("tax_group_id") REFERENCES "tax_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_configs" ADD CONSTRAINT "FK_1b412e9be287124eafa9eef4ba1" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_configs" ADD CONSTRAINT "FK_ecf3bdebe751a987adbc808f3af" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tax_configs" ADD CONSTRAINT "FK_dafaef97638d550f09b860504b7" FOREIGN KEY ("tax_group_id") REFERENCES "tax_groups"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_presets" ADD CONSTRAINT "FK_74685440e8b0b8f1b330594bf2e" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_preset_branches" ADD CONSTRAINT "FK_216df044bfba929116561fe7662" FOREIGN KEY ("discount_preset_id") REFERENCES "discount_presets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_preset_branches" ADD CONSTRAINT "FK_bdb5f2d628282b6080e6d7c7e25" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discount_preset_branches" DROP CONSTRAINT "FK_bdb5f2d628282b6080e6d7c7e25"`);
        await queryRunner.query(`ALTER TABLE "discount_preset_branches" DROP CONSTRAINT "FK_216df044bfba929116561fe7662"`);
        await queryRunner.query(`ALTER TABLE "discount_presets" DROP CONSTRAINT "FK_74685440e8b0b8f1b330594bf2e"`);
        await queryRunner.query(`ALTER TABLE "tax_configs" DROP CONSTRAINT "FK_dafaef97638d550f09b860504b7"`);
        await queryRunner.query(`ALTER TABLE "tax_configs" DROP CONSTRAINT "FK_ecf3bdebe751a987adbc808f3af"`);
        await queryRunner.query(`ALTER TABLE "tax_configs" DROP CONSTRAINT "FK_1b412e9be287124eafa9eef4ba1"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_fa5577d2a5137745afb4f4266bd"`);
        await queryRunner.query(`ALTER TABLE "tax_groups" DROP CONSTRAINT "FK_306659a1d6a86123d609f999847"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "tax_group_id"`);
        await queryRunner.query(`DROP TABLE "discount_preset_branches"`);
        await queryRunner.query(`DROP INDEX "public"."discount_presets_tenant_id_index"`);
        await queryRunner.query(`DROP TABLE "discount_presets"`);
        await queryRunner.query(`DROP INDEX "public"."tax_configs_tenant_branch_index"`);
        await queryRunner.query(`DROP INDEX "public"."tax_configs_tenant_branch_group_index"`);
        await queryRunner.query(`DROP TABLE "tax_configs"`);
        await queryRunner.query(`DROP INDEX "public"."tax_groups_tenant_id_index"`);
        await queryRunner.query(`DROP TABLE "tax_groups"`);
    }

}
