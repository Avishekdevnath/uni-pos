import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchSettings1743200002000 implements MigrationInterface {
  name = 'AddBranchSettings1743200002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD "branch_settings" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "branch_settings"`);
  }
}
