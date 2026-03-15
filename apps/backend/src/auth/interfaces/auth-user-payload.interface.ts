import { UserRole } from '../../users/entities/user.entity/user.entity';

export interface AuthUserPayload {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  defaultBranchId: string;
}
