import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminDataService } from './admin-data.service';
import { PermissionKey } from '../types/admin.models';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated && auth.isStaff) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated || !auth.isStaff) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated || !auth.isAdmin) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const permissionGuard = (permission: PermissionKey): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const data = inject(AdminDataService);
    const router = inject(Router);
    if (!auth.isAuthenticated || !auth.isStaff) {
      router.navigate(['/login']);
      return false;
    }
    if (auth.isAdmin) return true;
    if (!data.hasPermission(permission)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
};
