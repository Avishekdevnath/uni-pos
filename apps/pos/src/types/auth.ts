export interface PosUser {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  tenantId: string;
  defaultBranchId: string;
}

export interface PosRole {
  id: string;
  name: string;
  slug: string;
}

export interface PosBranch {
  id: string;
  name: string;
  code: string;
}

export interface PosTenant {
  name: string;
  defaultCurrency: string;
}

export interface PosMeResponse {
  user: PosUser;
  role: PosRole;
  permissions: string[];
  branch: PosBranch;
  tenant: PosTenant;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}
