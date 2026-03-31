import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderItemsNullableProduct1743200001000 implements MigrationInterface {
  name = 'UpdateOrderItemsNullableProduct1743200001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "description" character varying(500)`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "manual_tax_rate" numeric(5,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_or_description_check"
       CHECK (product_id IS NOT NULL OR description IS NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_or_description_check"`,
    );
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "manual_tax_rate"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "product_id" SET NOT NULL`);
  }
}
