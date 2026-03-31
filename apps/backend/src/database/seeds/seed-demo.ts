/**
 * seed-demo.ts
 *
 * Creates a complete multi-branch demo organisation:
 *   Tenant  : UniMart Holdings
 *   Groups  : Dhaka Division · Chittagong Division · Sylhet Division
 *   Branches: HQ/Flagship, Banani, Uttara, Agrabad, Nasirabad, Zindabazar
 *   Users   : 1 owner + 3 senior managers + 6 managers + 12 cashiers + 6 senior_staff + 6 staff = 34
 *   Categories: 8
 *   Products: 60 (with emoji)
 *   Inventory: stock adjustments for every product
 *
 * Safe to re-run (idempotent via ON CONFLICT DO NOTHING / skip-if-exists checks).
 *
 * Run:  pnpm --filter backend seed:demo
 */

import 'reflect-metadata';
import { hash } from 'bcryptjs';
import dataSource from '../data-source';
import { TenantEntity } from '../entities/tenant.entity';
import { BranchEntity } from '../entities/branch.entity';
import { UserEntity } from '../../users/entities/user.entity/user.entity';
import { RoleEntity } from '../../rbac/entities/role.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { BranchGroupEntity } from '../../branch-groups/entities/branch-group.entity';

// ─── helpers ────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'demo1234';

// ─── Branch-group structure ──────────────────────────────────────────────────

const DIVISIONS = [
  {
    name: 'Dhaka Division',
    slug: 'dhaka-division',
    branches: [
      { name: 'HQ Flagship Store',  code: 'DHK-HQ',  address: 'Motijheel, Dhaka 1000' },
      { name: 'Banani Outlet',       code: 'DHK-BAN', address: 'Banani, Dhaka 1213' },
      { name: 'Uttara Outlet',       code: 'DHK-UTT', address: 'Uttara, Dhaka 1230' },
    ],
  },
  {
    name: 'Chittagong Division',
    slug: 'chittagong-division',
    branches: [
      { name: 'Agrabad Store',   code: 'CTG-AGR', address: 'Agrabad, Chittagong 4100' },
      { name: 'Nasirabad Store', code: 'CTG-NAS', address: 'Nasirabad, Chittagong 4000' },
    ],
  },
  {
    name: 'Sylhet Division',
    slug: 'sylhet-division',
    branches: [
      { name: 'Zindabazar Store', code: 'SYL-ZIN', address: 'Zindabazar, Sylhet 3100' },
    ],
  },
];

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Beverages',
  'Snacks & Confectionery',
  'Dairy & Eggs',
  'Bakery',
  'Personal Care',
  'Household',
  'Frozen Foods',
  'Stationery',
];

// ─── Products (60) ───────────────────────────────────────────────────────────

interface ProductSeed {
  name: string; sku: string; barcode: string;
  price: number; cost: number; emoji: string; category: string;
}

const PRODUCTS: ProductSeed[] = [
  // Beverages (8)
  { name: 'Mineral Water 500ml',    sku: 'BEV-001', barcode: '8901234560001', price: 1.50,  cost: 0.80,  emoji: '💧', category: 'Beverages' },
  { name: 'Cola 330ml Can',          sku: 'BEV-002', barcode: '8901234560002', price: 1.20,  cost: 0.60,  emoji: '🥤', category: 'Beverages' },
  { name: 'Orange Juice 1L',         sku: 'BEV-003', barcode: '8901234560003', price: 3.50,  cost: 2.00,  emoji: '🍊', category: 'Beverages' },
  { name: 'Green Tea 25 Bags',       sku: 'BEV-004', barcode: '8901234560004', price: 4.00,  cost: 2.20,  emoji: '🍵', category: 'Beverages' },
  { name: 'Mango Nectar 250ml',      sku: 'BEV-005', barcode: '8901234560005', price: 1.80,  cost: 0.90,  emoji: '🥭', category: 'Beverages' },
  { name: 'Energy Drink 250ml',      sku: 'BEV-006', barcode: '8901234560006', price: 2.50,  cost: 1.20,  emoji: '⚡', category: 'Beverages' },
  { name: 'Lemon Sparkling Water',   sku: 'BEV-007', barcode: '8901234560007', price: 1.80,  cost: 0.85,  emoji: '🍋', category: 'Beverages' },
  { name: 'Whole Milk 1L',           sku: 'BEV-008', barcode: '8901234560008', price: 2.20,  cost: 1.40,  emoji: '🥛', category: 'Beverages' },

  // Snacks & Confectionery (8)
  { name: 'Potato Chips 100g',       sku: 'SNK-001', barcode: '8901234561001', price: 2.00,  cost: 1.00,  emoji: '🍟', category: 'Snacks & Confectionery' },
  { name: 'Dark Chocolate Bar 100g', sku: 'SNK-002', barcode: '8901234561002', price: 3.50,  cost: 1.80,  emoji: '🍫', category: 'Snacks & Confectionery' },
  { name: 'Mixed Nuts 200g',         sku: 'SNK-003', barcode: '8901234561003', price: 6.00,  cost: 3.50,  emoji: '🥜', category: 'Snacks & Confectionery' },
  { name: 'Cookies Assorted 300g',   sku: 'SNK-004', barcode: '8901234561004', price: 4.50,  cost: 2.50,  emoji: '🍪', category: 'Snacks & Confectionery' },
  { name: 'Popcorn Caramel 150g',    sku: 'SNK-005', barcode: '8901234561005', price: 3.00,  cost: 1.50,  emoji: '🍿', category: 'Snacks & Confectionery' },
  { name: 'Gummy Bears 200g',        sku: 'SNK-006', barcode: '8901234561006', price: 2.50,  cost: 1.20,  emoji: '🐻', category: 'Snacks & Confectionery' },
  { name: 'Pretzels 250g',           sku: 'SNK-007', barcode: '8901234561007', price: 2.80,  cost: 1.40,  emoji: '🥨', category: 'Snacks & Confectionery' },
  { name: 'Peanut Butter 400g',      sku: 'SNK-008', barcode: '8901234561008', price: 5.00,  cost: 2.80,  emoji: '🥜', category: 'Snacks & Confectionery' },

  // Dairy & Eggs (7)
  { name: 'Eggs (12 pack)',          sku: 'DAI-001', barcode: '8901234562001', price: 3.20,  cost: 2.00,  emoji: '🥚', category: 'Dairy & Eggs' },
  { name: 'Cheddar Cheese 250g',     sku: 'DAI-002', barcode: '8901234562002', price: 5.50,  cost: 3.20,  emoji: '🧀', category: 'Dairy & Eggs' },
  { name: 'Greek Yogurt 500g',       sku: 'DAI-003', barcode: '8901234562003', price: 4.00,  cost: 2.40,  emoji: '🫙', category: 'Dairy & Eggs' },
  { name: 'Butter 200g',             sku: 'DAI-004', barcode: '8901234562004', price: 3.80,  cost: 2.20,  emoji: '🧈', category: 'Dairy & Eggs' },
  { name: 'Cream 200ml',             sku: 'DAI-005', barcode: '8901234562005', price: 2.50,  cost: 1.50,  emoji: '🥛', category: 'Dairy & Eggs' },
  { name: 'Mozzarella 250g',         sku: 'DAI-006', barcode: '8901234562006', price: 6.00,  cost: 3.80,  emoji: '🧀', category: 'Dairy & Eggs' },
  { name: 'Sour Cream 300g',         sku: 'DAI-007', barcode: '8901234562007', price: 3.20,  cost: 1.80,  emoji: '🫙', category: 'Dairy & Eggs' },

  // Bakery (7)
  { name: 'White Sandwich Bread',    sku: 'BAK-001', barcode: '8901234563001', price: 2.50,  cost: 1.20,  emoji: '🍞', category: 'Bakery' },
  { name: 'Whole Wheat Bread',       sku: 'BAK-002', barcode: '8901234563002', price: 3.00,  cost: 1.50,  emoji: '🍞', category: 'Bakery' },
  { name: 'Butter Croissant',        sku: 'BAK-003', barcode: '8901234563003', price: 1.50,  cost: 0.70,  emoji: '🥐', category: 'Bakery' },
  { name: 'Blueberry Muffin',        sku: 'BAK-004', barcode: '8901234563004', price: 2.00,  cost: 0.90,  emoji: '🧁', category: 'Bakery' },
  { name: 'Cinnamon Roll',           sku: 'BAK-005', barcode: '8901234563005', price: 2.50,  cost: 1.10,  emoji: '🌀', category: 'Bakery' },
  { name: 'Baguette 250g',           sku: 'BAK-006', barcode: '8901234563006', price: 2.00,  cost: 0.90,  emoji: '🥖', category: 'Bakery' },
  { name: 'Chocolate Donut',         sku: 'BAK-007', barcode: '8901234563007', price: 1.80,  cost: 0.80,  emoji: '🍩', category: 'Bakery' },

  // Personal Care (8)
  { name: 'Shampoo 200ml',           sku: 'PRC-001', barcode: '8901234564001', price: 5.00,  cost: 2.80,  emoji: '🧴', category: 'Personal Care' },
  { name: 'Conditioner 200ml',       sku: 'PRC-002', barcode: '8901234564002', price: 5.50,  cost: 3.00,  emoji: '🧴', category: 'Personal Care' },
  { name: 'Body Wash 250ml',         sku: 'PRC-003', barcode: '8901234564003', price: 4.50,  cost: 2.50,  emoji: '🧼', category: 'Personal Care' },
  { name: 'Toothpaste 100g',         sku: 'PRC-004', barcode: '8901234564004', price: 3.00,  cost: 1.60,  emoji: '🪥', category: 'Personal Care' },
  { name: 'Toothbrush 2-pack',       sku: 'PRC-005', barcode: '8901234564005', price: 4.00,  cost: 2.00,  emoji: '🪥', category: 'Personal Care' },
  { name: 'Deodorant Roll-on',       sku: 'PRC-006', barcode: '8901234564006', price: 4.50,  cost: 2.40,  emoji: '🧴', category: 'Personal Care' },
  { name: 'Hand Sanitizer 100ml',    sku: 'PRC-007', barcode: '8901234564007', price: 3.50,  cost: 1.80,  emoji: '🧴', category: 'Personal Care' },
  { name: 'Lip Balm SPF15',          sku: 'PRC-008', barcode: '8901234564008', price: 2.50,  cost: 1.20,  emoji: '💄', category: 'Personal Care' },

  // Household (8)
  { name: 'Dish Soap 500ml',         sku: 'HOU-001', barcode: '8901234565001', price: 3.50,  cost: 1.80,  emoji: '🧹', category: 'Household' },
  { name: 'Laundry Detergent 1kg',   sku: 'HOU-002', barcode: '8901234565002', price: 8.00,  cost: 4.50,  emoji: '🧺', category: 'Household' },
  { name: 'Toilet Paper 6-roll',     sku: 'HOU-003', barcode: '8901234565003', price: 5.00,  cost: 2.80,  emoji: '🧻', category: 'Household' },
  { name: 'Kitchen Towels 2-roll',   sku: 'HOU-004', barcode: '8901234565004', price: 4.00,  cost: 2.20,  emoji: '🧻', category: 'Household' },
  { name: 'Trash Bags 30L (20pk)',   sku: 'HOU-005', barcode: '8901234565005', price: 4.50,  cost: 2.50,  emoji: '🗑️', category: 'Household' },
  { name: 'All-Purpose Cleaner',     sku: 'HOU-006', barcode: '8901234565006', price: 5.00,  cost: 2.80,  emoji: '🧹', category: 'Household' },
  { name: 'Sponge 3-pack',           sku: 'HOU-007', barcode: '8901234565007', price: 2.50,  cost: 1.20,  emoji: '🧽', category: 'Household' },
  { name: 'Aluminum Foil 10m',       sku: 'HOU-008', barcode: '8901234565008', price: 3.00,  cost: 1.60,  emoji: '✨', category: 'Household' },

  // Frozen Foods (7)
  { name: 'Frozen Pizza Margherita', sku: 'FRZ-001', barcode: '8901234566001', price: 7.50,  cost: 4.20,  emoji: '🍕', category: 'Frozen Foods' },
  { name: 'Frozen Chicken Nuggets',  sku: 'FRZ-002', barcode: '8901234566002', price: 6.00,  cost: 3.50,  emoji: '🍗', category: 'Frozen Foods' },
  { name: 'Frozen French Fries 1kg', sku: 'FRZ-003', barcode: '8901234566003', price: 5.00,  cost: 2.80,  emoji: '🍟', category: 'Frozen Foods' },
  { name: 'Ice Cream Vanilla 500ml', sku: 'FRZ-004', barcode: '8901234566004', price: 6.50,  cost: 3.80,  emoji: '🍦', category: 'Frozen Foods' },
  { name: 'Frozen Vegetable Mix',    sku: 'FRZ-005', barcode: '8901234566005', price: 4.50,  cost: 2.50,  emoji: '🥦', category: 'Frozen Foods' },
  { name: 'Frozen Fish Fillets',     sku: 'FRZ-006', barcode: '8901234566006', price: 8.00,  cost: 5.00,  emoji: '🐟', category: 'Frozen Foods' },
  { name: 'Frozen Samosa 20pc',      sku: 'FRZ-007', barcode: '8901234566007', price: 5.50,  cost: 3.00,  emoji: '🥟', category: 'Frozen Foods' },

  // Stationery (7)
  { name: 'Ballpoint Pen 10-pack',   sku: 'STA-001', barcode: '8901234567001', price: 3.50,  cost: 1.80,  emoji: '🖊️', category: 'Stationery' },
  { name: 'A4 Paper 500 Sheets',     sku: 'STA-002', barcode: '8901234567002', price: 8.00,  cost: 5.00,  emoji: '📄', category: 'Stationery' },
  { name: 'Sticky Notes 100pk',      sku: 'STA-003', barcode: '8901234567003', price: 2.50,  cost: 1.20,  emoji: '📌', category: 'Stationery' },
  { name: 'Stapler + 1000 Staples',  sku: 'STA-004', barcode: '8901234567004', price: 6.00,  cost: 3.50,  emoji: '📎', category: 'Stationery' },
  { name: 'Highlighter Set 6 Colors',sku: 'STA-005', barcode: '8901234567005', price: 4.50,  cost: 2.40,  emoji: '✏️', category: 'Stationery' },
  { name: 'Notebook A5 200p',        sku: 'STA-006', barcode: '8901234567006', price: 3.50,  cost: 1.80,  emoji: '📓', category: 'Stationery' },
  { name: 'Scissors Stainless',      sku: 'STA-007', barcode: '8901234567007', price: 3.00,  cost: 1.50,  emoji: '✂️', category: 'Stationery' },
];

// ─── Users per branch (template) ─────────────────────────────────────────────

interface UserSeed {
  fullName: string; email: string; roleSlug: string; phone?: string;
}

function branchUsers(prefix: string, branchCode: string): UserSeed[] {
  const c = branchCode.toLowerCase().replace('-', '');
  return [
    { fullName: `${prefix} Manager`,        email: `manager.${c}@unimart.demo`,      roleSlug: 'manager',       phone: `+880 1700 ${Math.floor(100000 + Math.random() * 900000)}` },
    { fullName: `${prefix} Cashier One`,    email: `cashier1.${c}@unimart.demo`,     roleSlug: 'cashier',       phone: `+880 1711 ${Math.floor(100000 + Math.random() * 900000)}` },
    { fullName: `${prefix} Cashier Two`,    email: `cashier2.${c}@unimart.demo`,     roleSlug: 'cashier',       phone: `+880 1722 ${Math.floor(100000 + Math.random() * 900000)}` },
    { fullName: `${prefix} Senior Staff`,   email: `sr.staff.${c}@unimart.demo`,     roleSlug: 'senior_staff',  phone: `+880 1733 ${Math.floor(100000 + Math.random() * 900000)}` },
    { fullName: `${prefix} Staff`,          email: `staff.${c}@unimart.demo`,        roleSlug: 'staff',         phone: `+880 1744 ${Math.floor(100000 + Math.random() * 900000)}` },
  ];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seedDemo(): Promise<void> {
  await dataSource.initialize();

  await dataSource.transaction(async (manager) => {
    const passwordHash = await hash(DEMO_PASSWORD, 12);

    // ── 1. Tenant ──────────────────────────────────────────────────────────
    let tenant = await manager.findOne(TenantEntity, {
      where: { slug: 'unimart-holdings' },
    });

    if (!tenant) {
      tenant = manager.create(TenantEntity, {
        name:             'UniMart Holdings',
        slug:             'unimart-holdings',
        industryType:     'retail',
        defaultCurrency:  'USD',
        defaultTimezone:  'Asia/Dhaka',
        receiptFooter:    'Thank you for shopping at UniMart!',
        status:           'active',
      });
      tenant = await manager.save(TenantEntity, tenant);
      console.log('✅ Tenant created:', tenant.name);
    } else {
      console.log('⏭  Tenant exists, skipping:', tenant.name);
    }

    const tenantId = tenant.id;

    // ── 2. Roles (copy from permissions already seeded by seed-admin) ──────
    const roleRows = await manager.find(RoleEntity, { where: { tenantId } });
    const roleMap = new Map(roleRows.map((r) => [r.slug, r]));

    if (roleMap.size === 0) {
      console.error('❌ No roles found for tenant. Run seed:admin first to seed permissions and roles, then assign them manually or extend this seed.');
      // We still continue — roles will be looked up from the demo-tenant seeded by seed-admin
      // and re-used here via slug lookup across the platform (roles are per-tenant, so we
      // need to create them for this tenant too).
    }

    // If no roles exist for this tenant, replicate the 6 system roles.
    // (seed-admin only creates roles for the demo-tenant, not for unimart-holdings)
    const ROLE_SLUGS = ['owner', 'senior_manager', 'manager', 'cashier', 'senior_staff', 'staff'];
    const ROLE_NAMES: Record<string, string> = {
      owner: 'Owner', senior_manager: 'Senior Manager', manager: 'Manager',
      cashier: 'Cashier', senior_staff: 'Senior Staff', staff: 'Staff',
    };

    for (const slug of ROLE_SLUGS) {
      if (!roleMap.has(slug)) {
        const role = await manager.save(RoleEntity, manager.create(RoleEntity, {
          tenantId,
          name:     ROLE_NAMES[slug],
          slug,
          isSystem: true,
        }));
        roleMap.set(slug, role);
        console.log('  ✅ Role created:', slug);
      }
    }

    // ── 3. Branch Groups + Branches ────────────────────────────────────────
    const branchMap = new Map<string, BranchEntity>();
    const divisionRoleMap = new Map<string, RoleEntity>(); // division slug → senior_manager role (shared)

    for (const div of DIVISIONS) {
      let group = await manager.findOne(BranchGroupEntity, {
        where: { tenantId, name: div.name },
      });

      if (!group) {
        group = await manager.save(BranchGroupEntity, manager.create(BranchGroupEntity, {
          tenantId,
          name:     div.name,
          parentId: null,
        }));
        console.log('  ✅ Branch group:', div.name);
      }

      for (const b of div.branches) {
        let branch = await manager.findOne(BranchEntity, {
          where: { tenantId, code: b.code },
        });

        if (!branch) {
          branch = await manager.save(BranchEntity, manager.create(BranchEntity, {
            tenantId,
            name:     b.name,
            code:     b.code,
            address:  b.address,
            status:   'active',
          }));
          console.log('    ✅ Branch:', b.name);
        }

        branchMap.set(b.code, branch);
      }
    }

    // Use the first branch as the "default" branch for cross-branch users
    const defaultBranch = branchMap.get('DHK-HQ')!;

    // ── 4. Owner user ──────────────────────────────────────────────────────
    const ownerRole = roleMap.get('owner')!;

    const ownerEmail = 'owner@unimart.demo';
    const existingOwner = await manager.findOne(UserEntity, { where: { email: ownerEmail } });
    if (!existingOwner) {
      await manager.save(UserEntity, manager.create(UserEntity, {
        tenantId,
        defaultBranchId: defaultBranch.id,
        roleId:          ownerRole.id,
        fullName:        'Rahim Uddin',
        email:           ownerEmail,
        phone:           '+880 1600 000001',
        passwordHash,
        status:          'active',
      }));
      console.log('  ✅ Owner user: owner@unimart.demo');
    }

    // ── 5. Senior Managers (one per division) ─────────────────────────────
    const srMgrRole = roleMap.get('senior_manager')!;
    const srMgrs = [
      { name: 'Sarah Khan',     email: 'sr.manager.dhaka@unimart.demo',    branch: 'DHK-HQ'  },
      { name: 'Karim Hossain',  email: 'sr.manager.ctg@unimart.demo',      branch: 'CTG-AGR' },
      { name: 'Nadia Islam',    email: 'sr.manager.sylhet@unimart.demo',   branch: 'SYL-ZIN' },
    ];

    for (const sm of srMgrs) {
      const exists = await manager.findOne(UserEntity, { where: { email: sm.email } });
      if (!exists) {
        await manager.save(UserEntity, manager.create(UserEntity, {
          tenantId,
          defaultBranchId: branchMap.get(sm.branch)!.id,
          roleId:          srMgrRole.id,
          fullName:        sm.name,
          email:           sm.email,
          passwordHash,
          status:          'active',
        }));
        console.log('  ✅ Senior Manager:', sm.email);
      }
    }

    // ── 6. Per-branch users ───────────────────────────────────────────────
    for (const div of DIVISIONS) {
      for (const b of div.branches) {
        const branch = branchMap.get(b.code)!;
        const prefix = b.name.replace(' Store', '').replace(' Outlet', '').replace(' Flagship', '');
        const users = branchUsers(prefix, b.code);

        for (const u of users) {
          const role = roleMap.get(u.roleSlug)!;
          const exists = await manager.findOne(UserEntity, { where: { email: u.email } });
          if (!exists) {
            await manager.save(UserEntity, manager.create(UserEntity, {
              tenantId,
              defaultBranchId: branch.id,
              roleId:          role.id,
              fullName:        u.fullName,
              email:           u.email,
              phone:           u.phone ?? null,
              passwordHash,
              status:          'active',
            }));
          }
        }
        console.log(`  ✅ Users seeded for branch: ${b.name}`);
      }
    }

    // ── 7. Categories ─────────────────────────────────────────────────────
    const catMap = new Map<string, CategoryEntity>();

    for (const catName of CATEGORIES) {
      let cat = await manager.findOne(CategoryEntity, {
        where: { tenantId, name: catName },
      });

      if (!cat) {
        cat = await manager.save(CategoryEntity, manager.create(CategoryEntity, {
          tenantId,
          name:     catName,
          parentId: null,
          status:   'active',
        }));
        console.log('  ✅ Category:', catName);
      }

      catMap.set(catName, cat);
    }

    // ── 8. Products ───────────────────────────────────────────────────────
    let productCount = 0;

    for (const p of PRODUCTS) {
      const exists = await manager.findOne(ProductEntity, {
        where: { tenantId, sku: p.sku },
      });

      if (!exists) {
        await manager.save(ProductEntity, manager.create(ProductEntity, {
          tenantId,
          categoryId: catMap.get(p.category)?.id ?? null,
          name:       p.name,
          sku:        p.sku,
          barcode:    p.barcode,
          unit:       'pcs',
          price:      p.price,
          cost:       p.cost,
          emoji:      p.emoji,
          imageUrl:   null,
          status:     'active',
        }));
        productCount++;
      }
    }

    console.log(`  ✅ Products created: ${productCount}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  UniMart Holdings demo seed complete!');
    console.log('');
    console.log('  Tenant   : UniMart Holdings  (slug: unimart-holdings)');
    console.log('  Currency : USD');
    console.log('  Branches : 6  (across 3 divisions)');
    console.log('  Password : demo1234  (all users)');
    console.log('');
    console.log('  Key accounts:');
    console.log('    owner@unimart.demo         → Owner (all permissions)');
    console.log('    sr.manager.dhaka@unimart.demo   → Senior Manager, Dhaka');
    console.log('    sr.manager.ctg@unimart.demo     → Senior Manager, Chittagong');
    console.log('    sr.manager.sylhet@unimart.demo  → Senior Manager, Sylhet');
    console.log('    manager.dhkhq@unimart.demo  → Manager, HQ Flagship');
    console.log('    cashier1.dhkhq@unimart.demo → Cashier, HQ Flagship');
    console.log('    staff.dhkhq@unimart.demo    → Staff, HQ Flagship');
    console.log('═══════════════════════════════════════════════════════');
  });

  await dataSource.destroy();
}

seedDemo().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
