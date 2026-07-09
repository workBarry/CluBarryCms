import { PermissionKey, UserRole } from '../types/admin.models';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  permissionsOverride?: Partial<Record<PermissionKey, boolean>>;
}
