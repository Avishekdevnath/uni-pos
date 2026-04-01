export interface User {
  sub: string;
  email: string;
  fullName: string;
  role: { id: string; name: string; slug: string } | null;
  tenantId: string;
  defaultBranchId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
