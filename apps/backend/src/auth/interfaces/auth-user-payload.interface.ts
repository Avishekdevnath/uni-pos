export interface AuthUserPayload {
  sub: string;
  email: string;
  fullName: string;
  roleId: string;
  tenantId: string;
  defaultBranchId: string;
  isPlatform: false;
  impersonatedBy?: string;
}
