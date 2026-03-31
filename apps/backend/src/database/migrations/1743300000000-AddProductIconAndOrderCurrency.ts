import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIconAndOrderCurrency1743300000000
  implements MigrationInterface
{
  name = 'AddProductIconAndOrderCurrency1743300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Products: emoji + image_url
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "emoji"     VARCHAR(16)  NULL,
        ADD COLUMN IF NOT EXISTS "image_url" TEXT         NULL
    `);

    // Orders: currency (copied from tenant at creation time)
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "currency" VARCHAR(16) NOT NULL DEFAULT 'USD'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders"   DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "image_url"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "emoji"`);
  }
}
