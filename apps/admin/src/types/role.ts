export interface Role {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithCount extends Role {
  permissionCount: number;
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RoleWithPermissions {
  role: Role;
  permissions: Permission[];
}
