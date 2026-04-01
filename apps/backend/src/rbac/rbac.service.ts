import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';
import { TenantEntity } from '../database/entities/tenant.entity';

// Standard permission matrix for system roles (fallback for broken tenants)
const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],
  senior_manager: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
    'tax:create', 'tax:read', 'tax:update', 'tax:delete',
    'discounts:create', 'discounts:read', 'discounts:update', 'discounts:delete', 'discounts:apply',
    'inventory:read', 'inventory:receive', 'inventory:adjust',
    'orders:create', 'orders:read', 'orders:cancel',
    'pos:sell', 'pos:void', 'pos:open_drawer',
    'staff:read',
    'branches:read',
    'audit:read', 'reports:read',
    'branch_groups:read',
    'pricing:read', 'pricing:update',
    'transfers:create', 'transfers:read', 'transfers:receive',
    'roles:manage',
  ],
  manager: [
    'products:read', 'categories:read', 'discounts:read', 'discounts:apply',
    'inventory:read', 'inventory:receive', 'inventory:adjust',
    'orders:create', 'orders:read', 'orders:cancel',
    'pos:sell', 'pos:void', 'pos:open_drawer',
    'branches:read', 'audit:read', 'reports:read',
    'pricing:read',
    'transfers:create', 'transfers:read',
  ],
  cashier: [
    'orders:create', 'pos:sell', 'pos:void', 'pos:open_drawer',
  ],
  senior_staff: [
    'inventory:receive', 'orders:create', 'pos:sell', 'pos:void',
  ],
  staff: [
    'orders:create', 'pos:sell',
  ],
};

interface CacheEntry {
  codes: string[];
  expiry: number;
}

const ROLE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TENANT_CACHE_TTL_MS = 60 * 1000;   // 60 seconds

@Injectable()
export class RbacService {
  private readonly roleCache = new Map<string, CacheEntry>();
  private readonly tenantCache = new Map<string, { active: boolean; expiry: number }>();

  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepo: Repository<RolePermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
  ) {}

  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rows = await this.rolePermissionRepo.find({
      where: { roleId },
      relations: ['permission'],
    });
    return rows.map((rp) => rp.permission.code);
  }

  invalidateRoleCache(roleId: string): void {
    this.roleCache.delete(roleId);
  }

  async isTenantActive(tenantId: string): Promise<boolean> {
    const cached = this.tenantCache.get(tenantId);
    if (cached && Date.now() < cached.expiry) {
      return cached.active;
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    const active = tenant ? tenant.status !== 'suspended' : false;
    this.tenantCache.set(tenantId, { active, expiry: Date.now() + TENANT_CACHE_TTL_MS });
    return active;
  }

  matchPermission(userPerm: string, required: string): boolean {
    if (userPerm === '*') return true;
    if (userPerm === required) return true;

    // Support "resource:*" wildcard
    const colonIdx = userPerm.indexOf(':');
    if (colonIdx !== -1 && userPerm.endsWith(':*')) {
      const userResource = userPerm.slice(0, colonIdx);
      const requiredResource = required.slice(0, required.indexOf(':'));
      return userResource === requiredResource;
    }

    return false;
  }

  async resolvePermissionsForUser(roleId: string): Promise<string[]> {
    const cached = this.roleCache.get(roleId);
    if (cached && Date.now() < cached.expiry) {
      return cached.codes;
    }

    let codes = await this.getPermissionsForRole(roleId);

    // Backward compatibility: if a system role has no permissions in the database
    // (can happen if permissions weren't seeded when the tenant was created),
    // apply the standard permission matrix as a fallback.
    if (codes.length === 0) {
      const role = await this.roleRepo.findOne({ where: { id: roleId } });
      if (role?.isSystem && role.slug && SYSTEM_ROLE_PERMISSIONS[role.slug]) {
        codes = SYSTEM_ROLE_PERMISSIONS[role.slug];
      }
    }

    this.roleCache.set(roleId, { codes, expiry: Date.now() + ROLE_CACHE_TTL_MS });
    return codes;
  }
}
