import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { TenantEntity } from '../database/entities/tenant.entity';

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

    const codes = await this.getPermissionsForRole(roleId);
    this.roleCache.set(roleId, { codes, expiry: Date.now() + ROLE_CACHE_TTL_MS });
    return codes;
  }
}
