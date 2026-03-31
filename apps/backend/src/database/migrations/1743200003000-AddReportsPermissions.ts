import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportsPermissions1743200003000 implements MigrationInterface {
  name = 'AddReportsPermissions1743200003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      { code: 'reports:view', resource: 'reports', action: 'view', description: 'View branch reports and analytics' },
      { code: 'customers:view', resource: 'customers', action: 'view', description: 'View customer profiles' },
      { code: 'customers:create', resource: 'customers', action: 'create', description: 'Create new customers' },
      { code: 'customers:edit', resource: 'customers', action: 'edit', description: 'Edit customer profiles' },
      { code: 'pos:discount_override', resource: 'pos', action: 'discount_override', description: 'Apply custom discounts at POS' },
      { code: 'inventory:manage', resource: 'inventory', action: 'manage', description: 'Manage inventory stock-in and adjustments' },
    ];

    for (const p of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (code, resource, action, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO NOTHING`,
        [p.code, p.resource, p.action, p.description],
      );
    }

    // Assign all new permissions to manager role (slug = 'manager')
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.slug = 'manager'
        AND p.code IN (
          'reports:view', 'customers:view', 'customers:create',
          'customers:edit', 'pos:discount_override', 'inventory:manage'
        )
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM permissions WHERE code IN (
        'reports:view', 'customers:view', 'customers:create',
        'customers:edit', 'pos:discount_override', 'inventory:manage'
      )
    `);
  }
}
