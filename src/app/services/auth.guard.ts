import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminConfigService } from './admin-config.service';
import { PermissionKey } from '../types/admin.models';

export const loginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitUntilReady();
  return auth.isAuthenticated && auth.isStaff ? router.createUrlTree(['/dashboard']) : true;
};

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitUntilReady();
  return auth.isAuthenticated && auth.isStaff ? true : router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitUntilReady();
  if (!auth.isAuthenticated) return router.createUrlTree(['/login']);
  return auth.isAdmin ? true : router.createUrlTree(['/dashboard']);
};

export const permissionGuard = (permission: PermissionKey): CanActivateFn => {
  return async () => {
    const auth = inject(AuthService);
    const config = inject(AdminConfigService);
    const router = inject(Router);
    await auth.waitUntilReady();
    if (!auth.isAuthenticated || !auth.isStaff) {
      return router.createUrlTree(['/login']);
    }
    if (auth.isAdmin) return true;
    await config.waitUntilPermissionsReady();
    return config.hasPermission(permission) ? true : router.createUrlTree(['/dashboard']);
  };
};
